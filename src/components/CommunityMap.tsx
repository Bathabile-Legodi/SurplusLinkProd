import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 

const ngoIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="32px" height="32px" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.25));">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="white" stroke-width="1.5"/>
    </svg>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const donorIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f172a" width="36px" height="36px" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));">
      <path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 2.83l7 7V20H5v-8.17l7-7z" stroke="white" stroke-width="1"/>
      <rect x="10" y="14" width="4" height="6" fill="white" />
    </svg>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Using the shared, working Supabase client from your project
import { supabase } from "@/lib/supabase";

// Fallback only used if we truly can't determine the donor's location
// (no stored lat/lng AND geocoding failed/unavailable).
const FALLBACK_LOCATION: [number, number] = [-26.2041, 28.0473]; // Johannesburg

// Geocodes a text address via the Google Geocoding REST API. Only called
// as a fallback for donors who signed up before lat/lng capture existed.
async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!address || !apiKey) return null;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:ZA&key=${apiKey}`
    );
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
      return [loc.lat, loc.lng];
    }
    console.warn("[CommunityMap] Geocoding returned no usable result for donor address:", address, data);
    return null;
  } catch (e) {
    console.error("[CommunityMap] Geocoding request failed:", e);
    return null;
  }
}

interface CommunityMapProps {
  loggedInDonorId: string;
  donorAddress?: string;
}

function MapBoundsFitter({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  }, [map, points]);
  return null;
}

export default function CommunityMap({ loggedInDonorId, donorAddress }: CommunityMapProps) {
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [donorLocation, setDonorLocation] = useState<[number, number] | null>(null);
  const [donorLocationLoading, setDonorLocationLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!loggedInDonorId) return; 

      const { data, error } = await supabase
        .from('donor_community_network')
        .select('*')
        .eq('donor_id', loggedInDonorId);
        
      if (!error && data) {
        setNetworkData(data);
      } else {
        console.error("Supabase Error:", error);
      }
    }
    fetchData();
  }, [loggedInDonorId]);

  useEffect(() => {
    async function resolveDonorLocation() {
      if (!loggedInDonorId) return;
      setDonorLocationLoading(true);

      const { data: donorRow, error } = await supabase
        .from("donors")
        .select("address, address_components")
        .eq("id", loggedInDonorId)
        .maybeSingle();

      if (error) {
        console.error("[CommunityMap] Failed to fetch donor location:", error);
        setDonorLocation(FALLBACK_LOCATION);
        setDonorLocationLoading(false);
        return;
      }

      // Prefer stored coordinates (present for anyone who signed up after
      // the lat/lng capture was added to register.tsx).
      const storedLat = donorRow?.address_components?.lat;
      const storedLng = donorRow?.address_components?.lng;
      if (typeof storedLat === "number" && typeof storedLng === "number") {
        setDonorLocation([storedLat, storedLng]);
        setDonorLocationLoading(false);
        return;
      }

      // Fall back to geocoding the stored text address for older accounts.
      const addressToGeocode = donorRow?.address || donorAddress;
      const geocoded = addressToGeocode ? await geocodeAddress(addressToGeocode) : null;
      setDonorLocation(geocoded ?? FALLBACK_LOCATION);
      setDonorLocationLoading(false);
    }

    resolveDonorLocation();
  }, [loggedInDonorId, donorAddress]);

  // Only render NGOs that actually have valid coordinates. NGOs registered
  // before location capture was added to register.tsx will have
  // ngo_latitude/ngo_longitude as null, which would otherwise render at (0,0).
  const validNgos = networkData.filter((ngo) => {
    const lat = Number(ngo.ngo_latitude);
    const lng = Number(ngo.ngo_longitude);
    return (
      ngo.ngo_latitude !== null &&
      ngo.ngo_longitude !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    );
  });

  if (donorLocationLoading || !donorLocation) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Locating your hub…
      </div>
    );
  }

  return (
    <div className="h-full w-full [&_.leaflet-tile-pane]:dark:invert [&_.leaflet-tile-pane]:dark:hue-rotate-180 [&_.leaflet-tile-pane]:dark:brightness-95 [&_.leaflet-tile-pane]:dark:contrast-100">
      <MapContainer 
        key={`map-${donorLocation[0]}-${donorLocation[1]}`}
        // @ts-ignore
        center={donorLocation} 
        zoom={11} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          // @ts-ignore
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <Marker position={donorLocation} icon={donorIcon}>
          <Popup>Your Hub</Popup>
        </Marker>

      <MapBoundsFitter points={[donorLocation, ...validNgos.map(ngo => [Number(ngo.ngo_latitude), Number(ngo.ngo_longitude)] as [number, number])]} />

      {validNgos.map((ngo, index) => {
        const ngoPosition: [number, number] = [Number(ngo.ngo_latitude), Number(ngo.ngo_longitude)];
        
        return (
          <React.Fragment key={index}>
            <Marker position={ngoPosition} icon={ngoIcon}>
              <Popup>{ngo.ngo_name}</Popup>
            </Marker>
            
            <Polyline 
              positions={[donorLocation, ngoPosition]} 
              pathOptions={{ color: '#10b981', weight: 3, dashArray: '5, 10' }} 
            />
          </React.Fragment>
        );
      })}
    </MapContainer>
    </div>
  );
}