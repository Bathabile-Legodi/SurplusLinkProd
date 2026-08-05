/**
 * useDeliveryMap.ts
 *
 * React hook that owns the full Google Maps lifecycle for the delivery
 * tracking page:
 *   1. Waits for the Maps JS SDK via a polling-based readiness check
 *      (robust against async-loading edge cases and already-loaded scripts)
 *   2. Geocodes originAddress (donor) and destAddress (NGO) to real LatLng
 *   3. Fetches the real road route via DirectionsService
 *   4. Renders a styled embedded map with:
 *      · Green "D" pin  — donor pickup location
 *      · Blue  "N" pin  — NGO destination
 *      · Amber arrow    — courier, moving along the route
 *   5. Whenever `progress` (0–1) changes, the courier is repositioned and
 *      its heading is updated to match the road direction.
 */

import { RefObject, useEffect, useRef, useState } from "react";
import { getDeliveryProgress } from "@/lib/delivery-sim";

// ── Internal Maps SDK readiness hook ──────────────────────────────────────
//
// We intentionally do NOT reuse the shared useGoogleMaps() from distance.ts
// because that hook waits for window.google.maps.routes specifically. With
// the Maps JS API's `loading=async` flag the `routes` sub-namespace is
// sometimes populated lazily, causing the shared hook to hang indefinitely
// when the script was already inserted by a previous page or is mid-load.
//
// This hook only requires window.google.maps (the core API), which is the
// minimum needed for Geocoder and DirectionsService. Polling at 200 ms is
// cheap and handles all three cases: fresh load, mid-load, already loaded.
function useGoogleMapsCore(): boolean {
  const [ready, setReady] = useState<boolean>(
    () => typeof window !== "undefined" && !!(window as any).google?.maps,
  );

  useEffect(() => {
    const gw = window as any;

    if (gw.google?.maps) {
      setReady(true);
      return;
    }

    // Ensure the script is in the DOM (safe to call even if already there)
    const SCRIPT_ID = "google-maps-script";
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id        = SCRIPT_ID;
      s.src       = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }&callback=initGoogleMaps&loading=async&libraries=routes`;
      s.async     = true;
      s.defer     = true;
      document.head.appendChild(s);
    }

    // Poll until the core namespace appears
    const timer = setInterval(() => {
      if ((window as any).google?.maps) {
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

/** Linearly interpolate a LatLng along a polyline at fractional position t. */
function interpolateAlongPath(path: any[], t: number): any | null {
  const gw = window as any;
  if (!path || path.length === 0) return null;
  if (t <= 0) return path[0];
  if (t >= 1) return path[path.length - 1];

  const idx = t * (path.length - 1);
  const lo  = Math.floor(idx);
  const hi  = Math.min(lo + 1, path.length - 1);
  const frac = idx - lo;

  const lat = path[lo].lat() + frac * (path[hi].lat() - path[lo].lat());
  const lng = path[lo].lng() + frac * (path[hi].lng() - path[lo].lng());
  return new gw.google.maps.LatLng(lat, lng);
}

/** Compute compass bearing (degrees 0–360) at position t along the path. */
function computeBearing(path: any[], t: number): number {
  if (!path || path.length < 2) return 0;
  const idx = Math.floor(t * (path.length - 1));
  const lo  = Math.max(0, Math.min(idx, path.length - 2));
  const hi  = lo + 1;

  const φ1 = (path[lo].lat() * Math.PI) / 180;
  const φ2 = (path[hi].lat() * Math.PI) / 180;
  const Δλ = ((path[hi].lng() - path[lo].lng()) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ── Geocoding helper ───────────────────────────────────────────────────────

/** Geocode a plain-text address → google.maps.LatLng | null.
 *  Uses componentRestrictions (hard country filter) rather than region
 *  (bias only) so results are strictly limited to South Africa. */
async function geocodeAddress(address: string): Promise<any | null> {
  const gw = window as any;
  return new Promise((resolve) => {
    new gw.google.maps.Geocoder().geocode(
      {
        address,
        // Hard filter — ONLY return South African results.
        // This prevents common street names (e.g. "Fulham Road") from
        // matching a higher-ranked global result in another country.
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


// ── Map styles ─────────────────────────────────────────────────────────────
// Keep styles minimal — only hide noisy layers. Aggressive road/landscape
// colour overrides can make roads invisible (white on near-white background)
// which causes the map to appear blank.
const MAP_STYLES = [
  { featureType: "poi",     stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// ── Custom SVG pin factory ─────────────────────────────────────────────────
function pinIcon(gw: any, color: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.059 27.941 0 18 0z" fill="${color}"/>
    <circle cx="18" cy="18" r="8" fill="white"/>
    <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}" font-family="sans-serif">${label}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new gw.google.maps.Size(36, 44),
    anchor: new gw.google.maps.Point(18, 44),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * @param mapRef              Ref to the <div> that will host the map
 * @param originAddress       Donor's address string (pickup location)
 * @param destAddress         NGO's address string (delivery destination)
 * @param progress            0–1 snapshot (used for initial placement)
 * @param claimedAt           ISO timestamp when the batch was claimed
 * @param collectionDatetime  ISO timestamp of the collection deadline
 */
export function useDeliveryMap(
  mapRef: RefObject<HTMLDivElement | null>,
  originAddress: string,
  destAddress: string,
  progress: number,
  claimedAt: string | null,
  collectionDatetime: string | null,
): DeliveryMapResult {
  const mapsReady = useGoogleMapsCore();

  const [routeReady,   setRouteReady]   = useState(false);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Stable refs — survive re-renders without triggering effects
  const courierMarkerRef = useRef<any>(null);
  const routePathRef     = useRef<any[]>([]);

  // ── Map initialisation ────────────────────────────────────────────────────
  // Re-runs when: Maps SDK becomes ready OR either address changes.
  useEffect(() => {
    if (!mapsReady)          return;
    if (!mapRef.current)     return;
    if (!originAddress || originAddress === "Location not specified") return;
    if (!destAddress   || destAddress   === "Location not specified") return;

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
      mapRef.current.innerHTML = ""; // clear any prior map instance

      // ── 2. Create the map ────────────────────────────────────────────────
      // Start centered between the two pins; fitBounds below will zoom properly.
      const map = new gw.google.maps.Map(mapRef.current, {
        center: { lat: originLL.lat(), lng: originLL.lng() },
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
        styles: MAP_STYLES,
      });

      // Force a resize in case the container was zero-sized at mount time
      gw.google.maps.event.trigger(map, "resize");

      // Immediately fit the viewport to both pins so the map is never blank
      const bounds = new gw.google.maps.LatLngBounds();
      bounds.extend(originLL);
      bounds.extend(destLL);
      map.fitBounds(bounds, /* padding px */ 60);

      // ── 3. Donor pickup pin (green) ──────────────────────────────────────
      new gw.google.maps.Marker({
        position: originLL,
        map,
        title: "Donor Pickup Location",
        icon: pinIcon(gw, "#16a34a", "D"),
        zIndex: 100,
      });

      // ── 4. NGO destination pin (blue) ────────────────────────────────────
      new gw.google.maps.Marker({
        position: destLL,
        map,
        title: "Your Organisation",
        icon: pinIcon(gw, "#2563eb", "N"),
        zIndex: 100,
      });

      // ── 5. Directions route ──────────────────────────────────────────────
      const directionsService  = new gw.google.maps.DirectionsService();
      const directionsRenderer = new gw.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        // preserveViewport: true so fitBounds (above) controls the view, not
        // the renderer. The renderer still draws the polyline correctly.
        preserveViewport: true,
        polylineOptions: {
          strokeColor:   "#3b82f6",
          strokeWeight:  5,
          strokeOpacity: 0.8,
        },
      });
      directionsRenderer.setMap(map);

      directionsService.route(
        {
          origin:      originLL,
          destination: destLL,
          travelMode:  gw.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: string) => {
          if (cancelled) return;

          if (status !== "OK" || !result) {
            console.warn("[useDeliveryMap] Directions failed:", status);
            // Still usable — just no route line / courier
            setRouteReady(true);
            return;
          }

          directionsRenderer.setDirections(result);

          const leg = result.routes?.[0]?.legs?.[0];
          if (leg) {
            setDistanceText(leg.distance?.text ?? "");
            setDurationText(leg.duration?.text ?? "");
          }

          // Store the overview path for interpolation
          const path: any[] = result.routes[0].overview_path;
          routePathRef.current = path;

          // ── 6. Courier marker (amber arrow) ──────────────────────────────
          const initPos     = interpolateAlongPath(path, progress);
          const initBearing = computeBearing(path, progress);

          const courierMarker = new gw.google.maps.Marker({
            position: initPos,
            map,
            title: "Courier",
            icon: {
              path:        gw.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale:       7,
              fillColor:   "#f59e0b",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              rotation:    initBearing,
            },
            zIndex: 999,
          });
          courierMarkerRef.current = courierMarker;

          // ── 7. Courier animation ──────────────────────────────────────────
          //
          // Phase A — Intro sweep (rAF, 2.5 s):
          //   Animate from position 0 (origin) to the REAL current progress
          //   so the user sees the courier "travel" the route on page load.
          //
          // Phase B — Real-time ticker (1 s interval):
          //   Keep the marker moving at the actual wall-clock pace so it
          //   continues to advance smoothly rather than jumping.

          // Helper: move marker to fractional position p along the path
          function placeAt(p: number) {
            const pos = interpolateAlongPath(path, p);
            if (!pos) return;
            courierMarker.setPosition(pos);
            const brng = computeBearing(path, p);
            const icon = courierMarker.getIcon();
            if (icon) courierMarker.setIcon({ ...icon, rotation: brng });
          }

          // Ease-in-out quad
          function easeInOut(t: number) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          }

          // Phase A — rAF intro sweep
          const INTRO_MS = 2500;
          const introStart = performance.now();
          const introEnd   = progress; // target = real current progress

          let rafId: number;
          let tickerId: ReturnType<typeof setInterval>;

          function introFrame(now: number) {
            if (cancelled) return;
            const t  = Math.min((now - introStart) / INTRO_MS, 1);
            const p  = easeInOut(t) * introEnd;
            placeAt(p);

            if (t < 1) {
              rafId = requestAnimationFrame(introFrame);
            } else {
              // Phase B — switch to real-time 1-second ticker
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

          // Store cleanup handles in the courier marker ref so the effect
          // cleanup can cancel them (the ref itself is set to null on cleanup)
          (courierMarker as any).__rafId     = () => cancelAnimationFrame(rafId);
          (courierMarker as any).__tickerId  = () => clearInterval(tickerId);

          setRouteReady(true);
        }
      );
    }

    initMap();

    return () => {
      cancelled = true;
      // Cancel any in-flight rAF or tick from the animation
      const m = courierMarkerRef.current;
      if (m) {
        m.__rafId?.();
        m.__tickerId?.();
      }
      courierMarkerRef.current = null;
      routePathRef.current     = [];
      if (mapRef.current) mapRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, originAddress, destAddress]);

  // Progress → marker is now handled entirely by the animation loop above.
  // This effect is kept as a safety fallback for when the route hasn't loaded
  // yet (e.g., Directions API is slow) so the marker still snaps on initial render.
  useEffect(() => {
    const marker = courierMarkerRef.current;
    const path   = routePathRef.current;
    // Only snap if there is NO active animation running (i.e., route not yet loaded)
    if (!marker || path.length > 0) return;

    const pos = interpolateAlongPath(path, progress);
    if (!pos) return;
    marker.setPosition(pos);

    const bearing     = computeBearing(path, progress);
    const existingIcon = marker.getIcon();
    if (existingIcon) marker.setIcon({ ...existingIcon, rotation: bearing });
  }, [progress]);

  return { routeReady, distanceText, durationText, geocodeError };
}
