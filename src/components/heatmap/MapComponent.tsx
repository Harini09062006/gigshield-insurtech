'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Zap, Shield, CloudRain, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const STATE_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Maharashtra": { lat: 19.7515, lng: 75.7139, zoom: 7 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569, zoom: 7 },
  "Karnataka": { lat: 15.3173, lng: 75.7139, zoom: 7 },
  "Delhi": { lat: 28.7041, lng: 77.1025, zoom: 10 },
  "Gujarat": { lat: 22.2587, lng: 71.1924, zoom: 7 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462, zoom: 7 },
  "West Bengal": { lat: 22.9868, lng: 87.8550, zoom: 7 },
  "Rajasthan": { lat: 27.0238, lng: 74.2179, zoom: 6 },
  "Kerala": { lat: 10.8505, lng: 76.2711, zoom: 7 },
  "Telangana": { lat: 18.1124, lng: 79.0193, zoom: 7 },
  "Andhra Pradesh": { lat: 15.9129, lng: 79.7400, zoom: 7 },
  "Punjab": { lat: 31.1471, lng: 75.3412, zoom: 8 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569, zoom: 7 },
  "Bihar": { lat: 25.0961, lng: 85.3131, zoom: 7 },
};

const DEFAULT_DISTRICTS = [
  // Maharashtra
  { zone_name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, radius_m: 8000, risk_level: "extreme", risk_score: 85, rainfall_mm: 72, aqi: 210, reason: "Heavy flooding + high AQI" },
  { zone_name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, radius_m: 10000, risk_level: "high", risk_score: 74, rainfall_mm: 58, aqi: 185, reason: "Waterlogging reported" },
  { zone_name: "Thane", state: "Maharashtra", lat: 19.2183, lng: 72.9781, radius_m: 8000, risk_level: "medium", risk_score: 52, rainfall_mm: 38, aqi: 155, reason: "Moderate rainfall" },
  // Tamil Nadu
  { zone_name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, radius_m: 8000, risk_level: "high", risk_score: 78, rainfall_mm: 63, aqi: 195, reason: "Coastal storm alert" },
  { zone_name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, radius_m: 10000, risk_level: "safe", risk_score: 12, rainfall_mm: 8, aqi: 65, reason: "Clear weather" },
  // Delhi
  { zone_name: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090, radius_m: 8000, risk_level: "extreme", risk_score: 92, rainfall_mm: 12, aqi: 410, reason: "Severe Air Pollution Alert" },
  // Karnataka
  { zone_name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946, radius_m: 9000, risk_level: "medium", risk_score: 48, rainfall_mm: 34, aqi: 148, reason: "Slow traffic + rain" },
  { zone_name: "Mysore", state: "Karnataka", lat: 12.2958, lng: 76.6394, radius_m: 9000, risk_level: "low", risk_score: 22, rainfall_mm: 12, aqi: 88, reason: "Mostly clear" },
  // Gujarat
  { zone_name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, radius_m: 10000, risk_level: "medium", risk_score: 45, rainfall_mm: 20, aqi: 160, reason: "Dust haze" },
  // West Bengal
  { zone_name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, radius_m: 8000, risk_level: "high", risk_score: 76, rainfall_mm: 65, aqi: 190, reason: "Cyclonic rain" },
];

export default function MapComponent({ searchQuery, workerState }: { searchQuery: string; workerState?: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeZones, setActiveZones] = useState<any[]>([]);

  const db = useFirestore();

  // Listen for realtime updates from Firestore
  useEffect(() => {
    if (!db) return;
    const q = collection(db, "disruption_zones");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbZones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveZones(dbZones.length > 0 ? dbZones : DEFAULT_DISTRICTS);
      setLastUpdated(new Date());
    });
    return () => unsubscribe();
  }, [db]);

  // Initial Map Setup
  useEffect(() => {
    if (mapInstanceRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // India Center
      zoom: 5,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false, // Custom position below
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;
    zonesLayerRef.current = L.layerGroup().addTo(map);

    // Auto-zoom to worker state if available
    if (workerState && STATE_COORDINATES[workerState]) {
      const { lat, lng, zoom } = STATE_COORDINATES[workerState];
      setTimeout(() => {
        map.flyTo([lat, lng], zoom, { duration: 2 });
      }, 1000);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [workerState]);

  // Handle Search and Zone Rendering
  useEffect(() => {
    if (!mapInstanceRef.current || !zonesLayerRef.current) return;
    
    renderZones(activeZones, searchQuery);

    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      // Try to find a district first
      const districtMatch = activeZones.find(z => z.zone_name.toLowerCase().includes(queryLower));
      if (districtMatch) {
        mapInstanceRef.current.flyTo([districtMatch.lat, districtMatch.lng], 10, { duration: 1.5 });
      } else {
        // Try state match
        const stateEntry = Object.entries(STATE_COORDINATES).find(([name]) => name.toLowerCase().includes(queryLower));
        if (stateEntry) {
          const [, coords] = stateEntry;
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], coords.zoom, { duration: 1.5 });
        }
      }
    }
  }, [searchQuery, activeZones]);

  function renderZones(data: any[], filter: string) {
    if (!zonesLayerRef.current || !mapInstanceRef.current) return;
    zonesLayerRef.current.clearLayers();

    const riskConfigs: any = {
      extreme: { fill: "#DC2626", border: "#991B1B", opacity: 0.75, pulse: true },
      high: { fill: "#F97316", border: "#C2410C", opacity: 0.65, pulse: true },
      medium: { fill: "#FBBF24", border: "#D97706", opacity: 0.55, pulse: false },
      low: { fill: "#4ADE80", border: "#16A34A", opacity: 0.45, pulse: false },
      safe: { fill: "#22C55E", border: "#15803D", opacity: 0.35, pulse: false }
    };

    data.forEach(zone => {
      const config = riskConfigs[zone.risk_level] || riskConfigs.safe;
      const isMatch = filter === '' || zone.zone_name.toLowerCase().includes(filter.toLowerCase()) || zone.state.toLowerCase().includes(filter.toLowerCase());
      const displayOpacity = filter === '' || isMatch ? config.opacity : 0.15;

      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius_m || 8000,
        fillColor: config.fill,
        fillOpacity: displayOpacity,
        color: isMatch && filter !== '' ? '#FFFFFF' : config.border,
        weight: isMatch && filter !== '' ? 4 : 2,
      });

      // Rich Popup Content
      const popupContent = `
        <div class="popup-card" style="min-width:220px; font-family: Inter, sans-serif;">
          <div style="border-top: 4px solid ${config.fill}; border-radius: 8px; background: white; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1)">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="height: 8px; width: 8px; border-radius: 50%; background: ${config.fill}"></div>
              <span style="font-weight: 800; font-size: 16px; color: #1A1A2E">${zone.zone_name}</span>
              <span style="margin-left: auto; font-size: 10px; font-weight: 700; color: ${config.border}; text-transform: uppercase;">${zone.risk_level}</span>
            </div>
            <div style="display: grid; gap: 6px; font-size: 12px; border-top: 1px solid #eee; padding-top: 8px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748B">Rainfall</span>
                <span style="font-weight: 700; color: #1A1A2E">${zone.rainfall_mm}mm</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748B">AQI</span>
                <span style="font-weight: 700; color: #1A1A2E">${zone.aqi}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748B">Risk Score</span>
                <span style="font-weight: 700; color: ${config.fill}">${zone.risk_score}/100</span>
              </div>
            </div>
            <p style="font-size: 11px; color: #64748B; font-style: italic; line-height: 1.4; background: #f8f9fa; padding: 6px; border-radius: 4px;">
              ${zone.reason}
            </p>
            <button style="width: 100%; margin-top: 10px; background: #6C47FF; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer;">
              VIEW FULL DETAILS
            </button>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent, { className: 'custom-popup' });
      circle.addTo(zonesLayerRef.current!);

      // Pulsing effect for high danger zones
      if (config.pulse && (filter === '' || isMatch)) {
        const pulseCircle = L.circle([zone.lat, zone.lng], {
          radius: (zone.radius_m || 8000) * 1.4,
          fillColor: config.fill,
          fillOpacity: 0.08,
          color: config.fill,
          weight: 1,
          dashArray: '5, 5',
          interactive: false
        }).addTo(zonesLayerRef.current!);
      }
    });
  }

  const stats = useMemo(() => {
    return {
      extreme: activeZones.filter(z => z.risk_level === 'extreme').length,
      high: activeZones.filter(z => z.risk_level === 'high').length,
      medium: activeZones.filter(z => z.risk_level === 'medium').length,
      safe: activeZones.filter(z => z.risk_level === 'safe' || z.risk_level === 'low').length,
    };
  }, [activeZones]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Top Stats Bar */}
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <div className="bg-[#DC2626]/10 border border-[#DC2626] text-[#DC2626] px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-xs whitespace-nowrap shadow-sm">
          <div className="h-2 w-2 rounded-full bg-[#DC2626]" /> {stats.extreme} Extreme zones
        </div>
        <div className="bg-[#F97316]/10 border border-[#F97316] text-[#F97316] px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-xs whitespace-nowrap shadow-sm">
          <div className="h-2 w-2 rounded-full bg-[#F97316]" /> {stats.high} High risk zones
        </div>
        <div className="bg-[#FBBF24]/10 border border-[#FBBF24] text-[#D97706] px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-xs whitespace-nowrap shadow-sm">
          <div className="h-2 w-2 rounded-full bg-[#FBBF24]" /> {stats.medium} Medium zones
        </div>
        <div className="bg-[#22C55E]/10 border border-[#22C55E] text-[#15803D] px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-xs whitespace-nowrap shadow-sm">
          <div className="h-2 w-2 rounded-full bg-[#22C55E]" /> {stats.safe} Safe zones
        </div>
      </div>

      <div className="relative flex-1 w-full rounded-card overflow-hidden shadow-card border border-border bg-white" style={{ minHeight: '520px', zIndex: 1 }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-card border border-border shadow-lg min-w-[180px]">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Risk Level Guide</h4>
          <div className="space-y-2">
            {[
              { color: "#DC2626", label: "Extreme Danger" },
              { color: "#F97316", label: "High Risk" },
              { color: "#FBBF24", label: "Medium Risk" },
              { color: "#4ADE80", label: "Low Risk" },
              { color: "#22C55E", label: "Safe Zone" }
            ].map((lvl, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px] font-semibold text-heading">
                <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: lvl.color }} />
                <span>{lvl.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Status Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border shadow-sm flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Live Data Sync</span>
          <span className="text-[8px] font-mono text-muted-foreground uppercase">Updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container { background: #EEEEFF; font-family: 'Inter', sans-serif; }
        .custom-popup .leaflet-popup-content-wrapper { padding: 0; background: transparent; border: none; box-shadow: none; }
        .custom-popup .leaflet-popup-content { margin: 0; width: auto !important; }
        .custom-popup .leaflet-popup-tip-container { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
