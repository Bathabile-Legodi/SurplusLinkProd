/**
 * useDeliveryMap.ts
 *
 * React hook that owns the full Google Maps lifecycle for the delivery
 * tracking page using modern Google Maps APIs (Routes API & Advanced Markers):
 *   1. Waits for the Maps JS SDK via a polling-based readiness check
 *   2. Geocodes originAddress (donor) and destAddress (NGO) to real LatLng
 *   3. Fetches the real road route via google.maps.routes.Route.computeRoutes
 *   4. Renders an embedded map with:
 *      · Green "D" pin  — donor pickup location (AdvancedMarkerElement)
 *      · Blue  "N" pin  — NGO destination (AdvancedMarkerElement)
 *      · Amber courier pin — courier moving along the polyline path
 *   5. Smoothly animates and updates courier position along the route
 */

import { RefObject, useEffect, useRef, useState } from "react";
import { getDeliveryProgress } from "@/lib/delivery-sim";

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

    // Ensure dummy global callback exists to prevent script parameter throws
    gw.initGoogleMaps = gw.initGoogleMaps || function () {};

    // Ensure script is present in the DOM with required libraries
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

    // Poll until core namespace, routes, marker, and geometry libraries are present
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

/** Linearly interpolate a LatLng along a path array at fractional position t. */
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

/** Geocode address with South Africa country restriction */
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
  pinContainer.style.position = "relative";
  pinContainer.style.display = "flex";
  pinContainer.style.alignItems = "center";
  pinContainer.style.justifyContent = "center";

  const pin = new gw.google.maps.marker.PinElement({
    background: color,
    borderColor: "#ffffff",
    glyphColor: "#ffffff",
    glyphText: labelText,
    scale: 1.1,
  });

  pinContainer.appendChild(pin);
  return pinContainer;
}

function createCourierPin(gw: any) {
  const pin = new gw.google.maps.marker.PinElement({
    background: "#f59e0b",
    borderColor: "#ffffff",
    glyphColor: "#ffffff",
    glyphText: "🚚",
    scale: 1.2,
  });
  return pin;
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

  // Stable refs across renders
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
      setRouteReady(false);
      setGeocodeError(null);
      setDistanceText("");
      setDurationText("");

      // ── 1. Geocode both addresses ────────────────────────────────────────
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

      if (!mapRef.current) return;
      mapRef.current.innerHTML = ""; // Clear existing map DOM nodes

      // ── 2. Create the Map ────────────────────────────────────────────────
      const map = new gw.google.maps.Map(mapRef.current, {
        center: originLL,
        zoom: 14,
        mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
      });

      gw.google.maps.event.trigger(map, "resize");

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

      // ── 4. Modern Routes API calculation ────────────────────────────────
      let decodedPath: any[] = [];

      try {
        const originLiteral = { lat: originLL.lat(), lng: originLL.lng() };
        const destLiteral = { lat: destLL.lat(), lng: destLL.lng() };

        const request = {
          origin: originLiteral,
          destination: destLiteral,
          travelMode: "DRIVING",
          fields: ["*"],
        };

        const response = await gw.google.maps.routes.Route.computeRoutes(request);
        console.log("[useDeliveryMap] computeRoutes raw response:", response);

        const routesList = Array.isArray(response) ? response : response?.routes;
        const route = routesList?.[0];

        if (route) {
          // Distance extraction
          if (route.distanceMeters != null) {
            setDistanceText(`${(route.distanceMeters / 1000).toFixed(1)} km`);
          }

          // Duration extraction
          const rawDuration = route.duration || route.staticDuration;
          if (rawDuration != null) {
            const seconds =
              typeof rawDuration === "number"
                ? rawDuration
                : typeof rawDuration === "object" && rawDuration.seconds
                ? Number(rawDuration.seconds)
                : parseInt(String(rawDuration).replace("s", ""), 10);
            if (!isNaN(seconds) && seconds > 0) {
              setDurationText(`${Math.round(seconds / 60)} mins`);
            }
          }

          // Polyline extraction
          if (Array.isArray(route.polyline)) {
            decodedPath = route.polyline.map((pt: any) =>
              pt instanceof gw.google.maps.LatLng
                ? pt
                : new gw.google.maps.LatLng(pt.lat, pt.lng)
            );
          } else {
            const encodedStr =
              typeof route.polyline === "string"
                ? route.polyline
                : route.polyline?.encodedPolyline ||
                  route.overviewPolyline?.encodedPolyline ||
                  route.overviewPolyline;

            if (typeof encodedStr === "string" && encodedStr.length > 0) {
              decodedPath = gw.google.maps.geometry.encoding.decodePath(encodedStr);
            }
          }
        }
      } catch (routesErr) {
        console.error("[useDeliveryMap] computeRoutes error:", routesErr);
      }

      if (cancelled) return;

      if (decodedPath.length === 0) {
        console.warn("[useDeliveryMap] Route calculation produced no path.");
        setGeocodeError("Could not calculate driving directions between addresses.");
        setRouteReady(true);
        return;
      }

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

      // Fit map bounds to full polyline path
      const polylineBounds = new gw.google.maps.LatLngBounds();
      decodedPath.forEach((pt: any) => polylineBounds.extend(pt));
      map.fitBounds(polylineBounds, 60);

      // ── 5. Courier Advanced Marker ────────────────────────────────────
      const initPos = interpolateAlongPath(decodedPath, progress);

      const courierMarker = new AdvancedMarkerElement({
        position: initPos,
        map,
        title: "Courier",
        content: createCourierPin(gw),
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