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
import { useGoogleMaps } from "@/lib/distance";

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
  const [resolvedCoords, setResolvedCoords] = useState<Record<string, [number, number]>>({});
  const [actualDonorLocation, setActualDonorLocation] = useState<[number, number]>([-26.2041, 28.0473]);
  const isMapsReady = useGoogleMaps();
  

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
    if (!isMapsReady || networkData.length === 0) return;

    const geocoder = new (window as any).google.maps.Geocoder();

    const geocodeMissing = async () => {
      const newCoords: Record<string, [number, number]> = {};
      let changed = false;

      for (const ngo of networkData) {
        if (!ngo.ngo_latitude || !ngo.ngo_longitude) {
          if (ngo.ngo_address && !resolvedCoords[ngo.ngo_id]) {
            try {
              const result = await new Promise((resolve, reject) => {
                geocoder.geocode({ 
                  address: ngo.ngo_address,
                  componentRestrictions: { country: "ZA" }
                }, (results: any, status: string) => {
                  if (status === "OK") resolve(results[0].geometry.location);
                  else reject(status);
                });
              });
              newCoords[ngo.ngo_id] = [(result as any).lat(), (result as any).lng()];
              changed = true;
            } catch (e) {
              console.error("Geocoding fallback failed for", ngo.ngo_address, e);
            }
          }
        }
      }

      // Geocode the donor's address if provided
      if (donorAddress && !resolvedCoords['__DONOR__']) {
        try {
          const result = await new Promise((resolve, reject) => {
            geocoder.geocode({ 
              address: donorAddress,
              componentRestrictions: { country: "ZA" }
            }, (results: any, status: string) => {
              if (status === "OK") resolve(results[0].geometry.location);
              else reject(status);
            });
          });
          const lat = (result as any).lat();
          const lng = (result as any).lng();
          newCoords['__DONOR__'] = [lat, lng];
          setActualDonorLocation([lat, lng]);
          changed = true;
        } catch (e) {
          console.error("Geocoding failed for donor address", donorAddress, e);
        }
      }

      if (changed) {
        setResolvedCoords(prev => ({ ...prev, ...newCoords }));
      }
    };

    geocodeMissing();
  }, [isMapsReady, networkData, donorAddress]); // intentionally omitting resolvedCoords to avoid loops

  return (
    <div className="h-full w-full [&_.leaflet-tile-pane]:dark:invert [&_.leaflet-tile-pane]:dark:hue-rotate-180 [&_.leaflet-tile-pane]:dark:brightness-95 [&_.leaflet-tile-pane]:dark:contrast-100">
      <MapContainer 
        key={`map-${actualDonorLocation[0]}-${actualDonorLocation[1]}`}
        // @ts-ignore
        center={actualDonorLocation} 
        zoom={11} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          // @ts-ignore
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <Marker position={actualDonorLocation} icon={donorIcon}>
          <Popup>Your Hub</Popup>
        </Marker>

      <MapBoundsFitter points={[actualDonorLocation, ...networkData
        .map(ngo => {
          let lat = Number(ngo.ngo_latitude);
          let lng = Number(ngo.ngo_longitude);
          if (!lat || !lng) {
            if (resolvedCoords[ngo.ngo_id]) return resolvedCoords[ngo.ngo_id];
            return null;
          }
          return [lat, lng] as [number, number];
        })
        .filter((p): p is [number, number] => p !== null)
      ]} />

      {networkData.map((ngo, index) => {
        let lat = Number(ngo.ngo_latitude);
        let lng = Number(ngo.ngo_longitude);

        if (!lat || !lng) {
          if (resolvedCoords[ngo.ngo_id]) {
            [lat, lng] = resolvedCoords[ngo.ngo_id];
          } else {
            return null; // Skip rendering if still no coordinates (prevents [0,0] ocean marker)
          }
        }

        const ngoPosition: [number, number] = [lat, lng];
        
        return (
          <React.Fragment key={index}>
            <Marker position={ngoPosition} icon={ngoIcon}>
              <Popup>{ngo.ngo_name}</Popup>
            </Marker>
            
            <Polyline 
              positions={[actualDonorLocation, ngoPosition]} 
              pathOptions={{ color: '#10b981', weight: 3, dashArray: '5, 10' }} 
            />
          </React.Fragment>
        );
      })}
    </MapContainer>
    </div>
  );
}