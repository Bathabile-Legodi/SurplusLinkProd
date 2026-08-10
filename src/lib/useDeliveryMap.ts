/**
 * useDeliveryMap.ts
 *
 * React hook that owns the full Google Maps lifecycle for the delivery
 * tracking page using modern Google Maps APIs (Routes API & Advanced Markers):
 *   1. Waits for the Maps JS SDK via polling readiness check
 *   2. Instantiates the Map canvas immediately to avoid blank renders
 *   3. Geocodes originAddress (donor) and destAddress (NGO) to real LatLng
 *   4. Fetches road route via google.maps.routes.Route.computeRoutes (with straight-line fallback)
 *   5. Formats distances in km and durations in hrs / mins
 *   6. Renders embedded map with Advanced Marker elements
 *   7. Smoothly animates courier position along the route
 */

import { RefObject, useEffect, useRef, useState } from "react";
import { getDeliveryProgress } from "@/lib/delivery-sim";

// ── Duration Formatter (Converts minutes to "X hr Y mins") ─────────────────
function formatDuration(totalMinutes: number): string {
  const mins = Math.round(totalMinutes);
  if (mins < 1) return "< 1 min";

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours === 0) {
    return `${remainingMins} min${remainingMins === 1 ? "" : "s"}`;
  }
  if (remainingMins === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }
  return `${hours} hr${hours === 1 ? "" : "s"} ${remainingMins} min${remainingMins === 1 ? "" : "s"}`;
}

// ── Internal Maps SDK readiness hook ──────────────────────────────────────
function useGoogleMapsCore(): boolean {
  const [ready, setReady] = useState<boolean>(
    () => typeof window !== "undefined" && !!(window as any).google?.maps,
  );

  useEffect(() => {
    const gw = window as any;

    if (gw.google?.maps?.routes && gw.google?.maps?.marker) {
      setReady(true);
      return;
    }

    gw.initGoogleMaps = gw.initGoogleMaps || function () {};

    const SCRIPT_ID = "google-maps-script";
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }&loading=async&libraries=routes,marker,geometry`;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    const timer = setInterval(() => {
      const g = (window as any).google;
      if (g?.maps?.routes && g?.maps?.marker && g?.maps?.geometry) {
        clearInterval(timer);
        setReady(true);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return ready;
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface DeliveryMapResult {
  routeReady: boolean;
  distanceText: string;
  durationText: string;
  geocodeError: string | null;
}

// ── Path maths ─────────────────────────────────────────────────────────────
function interpolateAlongPath(path: any[], t: number): any | null {
  const gw = window as any;
  if (!path || path.length === 0) return null;
  if (t <= 0) return path[0];
  if (t >= 1) return path[path.length - 1];

  const idx = t * (path.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, path.length - 1);
  const frac = idx - lo;

  const lat = path[lo].lat() + frac * (path[hi].lat() - path[lo].lat());
  const lng = path[lo].lng() + frac * (path[hi].lng() - path[lo].lng());
  return new gw.google.maps.LatLng(lat, lng);
}

// ── Geocoding helper ───────────────────────────────────────────────────────
async function geocodeAddress(address: string): Promise<any | null> {
  const gw = window as any;
  return new Promise((resolve) => {
    new gw.google.maps.Geocoder().geocode(
      {
        address,
        componentRestrictions: { country: "ZA" },
      },
      (results: any[], status: string) => {
        if (status === "OK" && results?.[0]?.geometry?.location) {
          resolve(results[0].geometry.location);
        } else {
          console.warn(`[useDeliveryMap] Geocoding failed for "${address}": ${status}`);
          resolve(null);
        }
      }
    );
  });
}

// ── Pin Element Factory ───────────────────────────────────────────────────
function createCustomPin(gw: any, color: string, labelText: string) {
  const pinContainer = document.createElement("div");
  pinContainer.innerHTML = `<div style="background-color: ${color}; color: white; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${labelText}</div>`;
  return pinContainer.firstElementChild as HTMLElement;
}

function createCourierPin(gw: any) {
  const pinContainer = document.createElement("div");
  pinContainer.innerHTML = `<div style="background-color: #f59e0b; color: white; border: 2px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚚</div>`;
  return { element: pinContainer.firstElementChild as HTMLElement };
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useDeliveryMap(
  mapRef: RefObject<HTMLDivElement | null>,
  originAddress: string,
  destAddress: string,
  progress: number,
  claimedAt: string | null,
  collectionDatetime: string | null,
): DeliveryMapResult {
  const mapsReady = useGoogleMapsCore();

  const [routeReady, setRouteReady] = useState(false);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const courierMarkerRef = useRef<any>(null);
  const routePathRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!mapsReady) return;
    if (!mapRef.current) return;
    if (!originAddress || originAddress === "Location not specified") return;
    if (!destAddress || destAddress === "Location not specified") return;

    const gw = window as any;
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current) return;

      setRouteReady(false);
      setGeocodeError(null);
      setDistanceText("");
      setDurationText("");

      mapRef.current.innerHTML = "";

      const defaultCenter = { lat: -26.2041, lng: 28.0473 };

      // ── 1. Create Map Canvas IMMEDIATELY ──────────────────────────────
      const map = new gw.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapId: "DEMO_MAP_ID",
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
      });

      setTimeout(() => {
        if (gw.google?.maps?.event) {
          gw.google.maps.event.trigger(map, "resize");
        }
      }, 100);

      // ── 2. Geocode Addresses ─────────────────────────────────────────────
      const [originLL, destLL] = await Promise.all([
        geocodeAddress(originAddress),
        geocodeAddress(destAddress),
      ]);

      if (cancelled) return;

      if (!originLL || !destLL) {
        setGeocodeError(
          !originLL && !destLL
            ? "Could not resolve the pickup or delivery address."
            : !originLL
            ? "Could not resolve the donor's pickup address."
            : "Could not resolve your organisation's address.",
        );
        return;
      }

      const bounds = new gw.google.maps.LatLngBounds();
      bounds.extend(originLL);
      bounds.extend(destLL);
      map.fitBounds(bounds, 60);

      // ── 3. Advanced Markers for Pickup and NGO Destination ────────────────
      const { AdvancedMarkerElement } = gw.google.maps.marker;

      new AdvancedMarkerElement({
        position: originLL,
        map,
        title: "Donor Pickup Location",
        content: createCustomPin(gw, "#16a34a", "D"),
        zIndex: 100,
      });

      new AdvancedMarkerElement({
        position: destLL,
        map,
        title: "Your Organisation",
        content: createCustomPin(gw, "#2563eb", "N"),
        zIndex: 100,
      });

      // ── 4. Routes API calculation ───────────────────────────────────────
      let decodedPath: any[] = [];

      try {
        const directionsService = new gw.google.maps.DirectionsService();
        const request = {
          origin: originLL,
          destination: destLL,
          travelMode: gw.google.maps.TravelMode.DRIVING,
        };

        const response = await new Promise<any>((resolve, reject) => {
          directionsService.route(request, (res: any, status: string) => {
            if (status === "OK") resolve(res);
            else reject(new Error(status));
          });
        });
        if (response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          decodedPath = route.overview_path;
          
          if (route.legs && route.legs.length > 0) {
            setDistanceText(route.legs[0].distance.text);
            setDurationText(route.legs[0].duration.text);
          }
        }
      } catch (routesErr) {
        console.error("[useDeliveryMap] DirectionsService error:", routesErr);
      }

      // Hard Fallback: Straight path between origin and destination
      if (decodedPath.length === 0) {
        decodedPath = [originLL, destLL];
        const meters = gw.google.maps.geometry.spherical.computeLength(decodedPath);
        setDistanceText(`${(meters / 1000).toFixed(1)} km`);
        
        const rawMins = Math.max(1, (meters / 1000 / 35) * 60);
        setDurationText(formatDuration(rawMins));
      }

      if (cancelled) return;

      routePathRef.current = decodedPath;

      // Render Polyline on Map
      if (polylineRef.current) polylineRef.current.setMap(null);

      const polyline = new gw.google.maps.Polyline({
        path: decodedPath,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeWeight: 5,
        strokeOpacity: 0.8,
        map,
      });
      polylineRef.current = polyline;

      const polylineBounds = new gw.google.maps.LatLngBounds();
      decodedPath.forEach((pt: any) => polylineBounds.extend(pt));
      map.fitBounds(polylineBounds, 60);

      // ── 5. Courier Advanced Marker ────────────────────────────────────
      const initPos = interpolateAlongPath(decodedPath, progress);

      const courierMarker = new AdvancedMarkerElement({
        position: initPos,
        map,
        title: "Courier",
        content: createCourierPin(gw).element,
        zIndex: 999,
      });
      courierMarkerRef.current = courierMarker;

      // ── 6. Courier movement animation loop ────────────────────────────
      function placeAt(p: number) {
        const pos = interpolateAlongPath(decodedPath, p);
        if (!pos) return;
        courierMarker.position = pos;
      }

      function easeInOut(t: number) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      }

      const INTRO_MS = 2500;
      const introStart = performance.now();
      const introEnd = progress;

      let rafId: number;
      let tickerId: ReturnType<typeof setInterval>;

      function introFrame(now: number) {
        if (cancelled) return;
        const t = Math.min((now - introStart) / INTRO_MS, 1);
        const p = easeInOut(t) * introEnd;
        placeAt(p);

        if (t < 1) {
          rafId = requestAnimationFrame(introFrame);
        } else {
          tickerId = setInterval(() => {
            if (cancelled) {
              clearInterval(tickerId);
              return;
            }
            const { progress: p2 } = getDeliveryProgress(
              claimedAt,
              collectionDatetime,
            );
            placeAt(Math.min(p2, 1));
          }, 1000);
        }
      }

      rafId = requestAnimationFrame(introFrame);

      (courierMarker as any).__rafId = () => cancelAnimationFrame(rafId);
      (courierMarker as any).__tickerId = () => clearInterval(tickerId);

      setRouteReady(true);
    }

    initMap();

    return () => {
      cancelled = true;
      const m = courierMarkerRef.current;
      if (m) {
        m.__rafId?.();
        m.__tickerId?.();
      }
      if (polylineRef.current) polylineRef.current.setMap(null);
      courierMarkerRef.current = null;
      routePathRef.current = [];
      if (mapRef.current) mapRef.current.innerHTML = "";
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, originAddress, destAddress]);

  // Fallback update for progress ticks
  useEffect(() => {
    const marker = courierMarkerRef.current;
    const path = routePathRef.current;
    if (!marker || path.length === 0) return;

    const pos = interpolateAlongPath(path, progress);
    if (pos) marker.position = pos;
  }, [progress]);

  return { routeReady, distanceText, durationText, geocodeError };
}