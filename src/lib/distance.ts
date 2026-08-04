import { useEffect, useState } from "react";

// Loads the Google Maps JS API with the "routes" library, shared across
// any page that needs driving distance (ngo/explore.tsx, donor/network.tsx, ...).
// Safe to call from multiple components — script tag is only injected once.
export function useGoogleMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ((window as any).google?.maps?.routes) {
      setReady(true);
      return;
    }

    if (!(window as any)._mapsReadyCallbacks) {
      (window as any)._mapsReadyCallbacks = [];
    }

    (window as any)._mapsReadyCallbacks.push(() => setReady(true));

    (window as any).initGoogleMaps = () => {
      if ((window as any)._mapsReadyCallbacks) {
        (window as any)._mapsReadyCallbacks.forEach((cb: () => void) => cb());
      }
    };

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => {
        if ((window as any).google?.maps?.routes) setReady(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&callback=initGoogleMaps&loading=async&libraries=routes`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {};
  }, []);

  return ready;
}

// Computes driving distance from one origin address to many destination
// addresses in a single batched call via the Routes API.
export async function getBatchDrivingDistances(
  origin: string,
  destinations: string[]
): Promise<string[]> {
  const globalWin = window as any;
  if (!globalWin.google?.maps?.routes || !origin || destinations.length === 0) {
    return destinations.map(() => "Distance unavailable");
  }

  const validDestinations = destinations.map((d) => (d.trim() === "" ? "Unknown Location" : d));

  try {
    const request = {
      origins: [origin],
      destinations: validDestinations,
      travelMode: "DRIVING",
      fields: ["distanceMeters", "condition"],
    };

    const response = await globalWin.google.maps.routes.RouteMatrix.computeRouteMatrix(request);

    const matrixItems = response?.matrix?.rows?.[0]?.items || response?.[0]?.elements;

    if (Array.isArray(matrixItems)) {
      return matrixItems.map((element: any) => {
        if (element && (element.condition === "ROUTE_EXISTS" || !element.status)) {
          const meters = element.distanceMeters;
          if (typeof meters === "number") {
            return `${(meters / 1000).toFixed(1)} km away`;
          }
        }
        return "Distance unknown";
      });
    }

    console.error("Route Matrix execution did not produce an array structure inside output container:", response);
    return destinations.map(() => "Distance error");
  } catch (e) {
    console.error("Failed executing modern route matrix operation:", e);
    return destinations.map(() => "Distance error");
  }
}

// Parses a leading number (in km) out of a distance string like "1.9 km away"
// for sorting purposes. Unresolved/errored distances sort to the end.
export function parseDistance(dist: string | undefined) {
  if (!dist || dist.includes("error") || dist.includes("unknown") || dist.includes("unavailable") || dist.includes("Calculating")) {
    return Infinity;
  }
  const match = dist.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : Infinity;
}