import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 

// Using the shared, working Supabase client from your project
import { supabase } from "@/lib/supabase";

interface CommunityMapProps {
  loggedInDonorId: string;
}

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
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
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

export default function CommunityMap({ loggedInDonorId }: CommunityMapProps) {
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
      const geocoded = donorRow?.address ? await geocodeAddress(donorRow.address) : null;
      setDonorLocation(geocoded ?? FALLBACK_LOCATION);
      setDonorLocationLoading(false);
    }

    resolveDonorLocation();
  }, [loggedInDonorId]);

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
    <MapContainer 
      center={donorLocation} 
      zoom={11} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      <Marker position={donorLocation}>
        <Popup>Your Hub</Popup>
      </Marker>

      {validNgos.map((ngo, index) => {
        const ngoPosition: [number, number] = [Number(ngo.ngo_latitude), Number(ngo.ngo_longitude)];
        
        return (
          <React.Fragment key={index}>
            <Marker position={ngoPosition}>
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
  );
}