import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import { createClient } from '@supabase/supabase-js';

// Pull credentials from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. TypeScript Label: Define the props coming into the component
interface CommunityMapProps {
  loggedInDonorId: string;
}

export default function CommunityMap({ loggedInDonorId }: CommunityMapProps) {
  // 2. TypeScript Label: Tell State to expect an array of any data
  const [networkData, setNetworkData] = useState<any[]>([]); 
  
  // Default center point (Johannesburg)
  const donorLocation: [number, number] = [-26.2041, 28.0473]; 

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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '15px' }}>Community Impact Network</h2>
      
      <MapContainer 
        center={donorLocation} 
        zoom={11} 
        style={{ height: '500px', width: '100%', borderRadius: '8px', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <Marker position={donorLocation}>
          <Popup>Your Hub</Popup>
        </Marker>

        {networkData.map((ngo, index) => {
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
    </div>
  );
}