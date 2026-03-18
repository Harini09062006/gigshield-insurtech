'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const STATE_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Maharashtra": { lat: 19.7515, lng: 75.7139, zoom: 7 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569, zoom: 7 },
  "Karnataka": { lat: 15.3173, lng: 75.7139, zoom: 7 },
  "Delhi": { lat: 28.7041, lng: 77.1025, zoom: 10 },
  "Gujarat": { lat: 22.2587, lng: 71.1924, zoom: 7 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462, zoom: 7 },
  "West Bengal": { lat: 22.9868, lng: 87.8550, zoom: 7 },
};

const DEFAULT_DISTRICTS = [
  { id: '1', zone_name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, radius_m: 8000, risk_level: "extreme", risk_score: 85, rainfall_mm: 72, aqi: 210, reason: "Heavy flooding + high AQI", earning_impact: 45 },
  { id: '2', zone_name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, radius_m: 10000, risk_level: "high", risk_score: 74, rainfall_mm: 58, aqi: 185, reason: "Waterlogging reported", earning_impact: 30 },
  { id: '3', zone_name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946, radius_m: 9000, risk_level: "medium", risk_score: 48, rainfall_mm: 34, aqi: 148, reason: "Slow traffic + rain", earning_impact: 15 },
  { id: '4', zone_name: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090, radius_m: 8000, risk_level: "extreme", risk_score: 92, rainfall_mm: 12, aqi: 410, reason: "Severe Air Pollution Alert", earning_impact: 50 },
];

export default function MapComponent({ searchQuery, workerState }: { searchQuery: string; workerState?: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [activeZones, setActiveZones] = useState<any[]>([]);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "disruption_zones"), (snapshot) => {
      const zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveZones(zones.length > 0 ? zones : DEFAULT_DISTRICTS);
    });
    return () => unsub();
  }, [db]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    if (workerState && STATE_COORDINATES[workerState]) {
      const { lat, lng, zoom } = STATE_COORDINATES[workerState];
      map.flyTo([lat, lng], zoom, { duration: 2 });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [workerState]);

  useEffect(() => {
    if (!layerGroupRef.current || !mapRef.current) return;
    
    layerGroupRef.current.clearLayers();

    const riskStyles: any = {
      extreme: { fill: "#DC2626", border: "#991B1B", opacity: 0.7 },
      high: { fill: "#F97316", border: "#C2410C", opacity: 0.6 },
      medium: { fill: "#FBBF24", border: "#D97706", opacity: 0.5 },
      safe: { fill: "#22C55E", border: "#15803D", opacity: 0.4 }
    };

    activeZones.forEach(zone => {
      const style = riskStyles[zone.risk_level] || riskStyles.safe;
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius_m || 2000,
        fillColor: style.fill,
        fillOpacity: style.opacity,
        color: style.border,
        weight: 2
      });

      const popup = `
        <div style="padding: 12px; min-width: 200px; font-family: Inter, sans-serif;">
          <h4 style="font-weight: 800; margin-bottom: 8px;">${zone.zone_name}</h4>
          <p style="font-size: 11px; color: #64748B; margin-bottom: 4px;">Rainfall: ${zone.rainfall_mm}mm | AQI: ${zone.aqi}</p>
          <p style="font-size: 11px; font-weight: 700; color: ${zone.risk_level === 'extreme' ? '#DC2626' : '#1A1A2E'}">
            Impact: -₹${zone.earning_impact}/hr
          </p>
        </div>
      `;

      circle.bindPopup(popup).addTo(layerGroupRef.current!);
    });
  }, [activeZones]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-2xl shadow-card border border-[#E8E6FF]" />;
}