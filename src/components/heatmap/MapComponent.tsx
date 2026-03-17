
'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';

// Fix for default marker icons in Leaflet
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface ZoneData {
  id: string;
  zone: string;
  lat: number;
  lng: number;
  risk: 'low' | 'medium' | 'high' | 'extreme';
  intensity: number;
}

const MOCK_MUMBAI_DATA: ZoneData[] = [
  { id: '1', zone: "South Mumbai", lat: 18.9322, lng: 72.8264, risk: "high", intensity: 0.9 },
  { id: '2', zone: "Andheri", lat: 19.1197, lng: 72.8469, risk: "medium", intensity: 0.6 },
  { id: '3', zone: "Bandra", lat: 19.0544, lng: 72.8405, risk: "medium", intensity: 0.5 },
  { id: '4', zone: "Dadar", lat: 19.0178, lng: 72.8478, risk: "low", intensity: 0.3 },
  { id: '5', zone: "Kurla", lat: 19.0726, lng: 72.8795, risk: "high", intensity: 0.8 },
  { id: '6', zone: "Thane", lat: 19.2183, lng: 72.9781, risk: "low", intensity: 0.2 }
];

const getColor = (intensity: number) => {
  if (intensity >= 0.8) return '#EF4444'; // Red
  if (intensity >= 0.6) return '#F97316'; // Orange
  if (intensity >= 0.3) return '#F59E0B'; // Amber
  return '#22C55E'; // Green
};

const getOpacity = (intensity: number) => {
  if (intensity >= 0.8) return 0.7;
  if (intensity >= 0.6) return 0.6;
  if (intensity >= 0.3) return 0.5;
  return 0.4;
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export default function MapComponent({ searchQuery }: { searchQuery: string }) {
  const db = useFirestore();
  
  const disruptionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "disruptionEvents"), limit(50));
  }, [db]);

  const { data: dbDisruptions } = useCollection(disruptionsQuery);

  const zones = useMemo(() => {
    const rawData = (dbDisruptions && dbDisruptions.length > 0) 
      ? dbDisruptions.map(d => ({
          id: d.id,
          zone: d.aiSuggestion || `Disruption at ${d.latitude.toFixed(2)}`,
          lat: d.latitude,
          lng: d.longitude,
          risk: d.riskLevel || (d.workersAffectedCount > 20 ? 'extreme' : 'high'),
          intensity: d.intensity || (d.workersAffectedCount > 20 ? 0.9 : 0.7)
        }))
      : MOCK_MUMBAI_DATA;

    if (!searchQuery) return rawData;
    return rawData.filter(z => z.zone.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [dbDisruptions, searchQuery]);

  return (
    <div className="w-full h-full min-h-[500px] rounded-card overflow-hidden border border-border shadow-card bg-white relative">
      <MapContainer 
        center={[19.0760, 72.8777]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        {zones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={1000 + (zone.intensity * 2000)}
            pathOptions={{
              fillColor: getColor(zone.intensity),
              color: getColor(zone.intensity),
              fillOpacity: getOpacity(zone.intensity),
              stroke: false,
            }}
          >
            <Tooltip permanent={false}>
              <div className="p-1">
                <p className="font-bold text-sm text-heading">{zone.zone}</p>
                <p className="text-xs capitalize font-medium" style={{ color: getColor(zone.intensity) }}>
                  Risk: {zone.risk}
                </p>
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
