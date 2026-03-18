'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const STATE_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Maharashtra": { lat: 19.0760, lng: 72.8777, zoom: 10 },
  "Tamil Nadu": { lat: 13.0827, lng: 80.2707, zoom: 10 },
  "Karnataka": { lat: 12.9716, lng: 77.5946, zoom: 10 },
  "Delhi": { lat: 28.6139, lng: 77.2090, zoom: 10 },
  "Gujarat": { lat: 23.0225, lng: 72.5714, zoom: 10 },
  "West Bengal": { lat: 22.5726, lng: 88.3639, zoom: 10 },
};

export default function MapComponent({ searchQuery, workerState }: { searchQuery: string; workerState?: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const db = useFirestore();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.0827, 80.2707], // Default to Tamil Nadu
      zoom: 7,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    // FIX 4: Fetch zones from Firestore and Render circles
    const renderZones = async () => {
      try {
        const state = workerState || 'Tamil Nadu';
        const zonesRef = collection(db, 'disruption_zones');
        const q = query(zonesRef, where('state', '==', state));
        const snapshot = await getDocs(q);
        let zones = snapshot.docs.map(d => ({id: d.id, ...d.data() as any}));

        // Seed data if empty for Tamil Nadu
        if (zones.length === 0 && state === 'Tamil Nadu') {
          zones = [
            {zone_name:"Chennai", state:"Tamil Nadu", lat:13.0827, lng:80.2707, risk_level:"extreme", risk_score:85, rainfall_mm:72, aqi:210, reason:"Heavy flooding + high AQI"},
            {zone_name:"Coimbatore", state:"Tamil Nadu", lat:11.0168, lng:76.9558, risk_level:"safe", risk_score:12, rainfall_mm:8, aqi:62, reason:"Clear skies — safe to deliver"},
            {zone_name:"Madurai", state:"Tamil Nadu", lat:9.9252, lng:78.1198, risk_level:"medium", risk_score:48, rainfall_mm:34, aqi:145, reason:"Moderate rainfall — caution advised"},
            {zone_name:"Salem", state:"Tamil Nadu", lat:11.6643, lng:78.1460, risk_level:"high", risk_score:68, rainfall_mm:55, aqi:175, reason:"Heavy rain — high disruption risk"},
            {zone_name:"Tiruchirappalli", state:"Tamil Nadu", lat:10.7905, lng:78.7047, risk_level:"low", risk_score:25, rainfall_mm:18, aqi:88, reason:"Light rain — low risk"},
            {zone_name:"Vellore", state:"Tamil Nadu", lat:12.9165, lng:79.1325, risk_level:"medium", risk_score:52, rainfall_mm:38, aqi:155, reason:"Moderate disruption risk"}
          ];
        }

        const riskColors: any = {
          extreme: {fill:'#DC2626', border:'#991B1B'},
          high:    {fill:'#F97316', border:'#C2410C'},
          medium:  {fill:'#FBBF24', border:'#D97706'},
          low:     {fill:'#4ADE80', border:'#16A34A'},
          safe:    {fill:'#22C55E', border:'#15803D'}
        };

        layerGroupRef.current?.clearLayers();

        zones.forEach(zone => {
          const c = riskColors[zone.risk_level] || riskColors.safe;
          
          L.circle([zone.lat, zone.lng], {
            radius: 2000,
            fillColor: c.fill,
            fillOpacity: 0.6,
            color: c.border,
            weight: 2,
            interactive: true
          }).addTo(layerGroupRef.current!).bindPopup(`
            <div style="min-width:200px;font-family: Inter,sans-serif">
              <div style="font-weight:700;font-size:15px; color:#1A1A2E;margin-bottom:6px">
                ${zone.zone_name}
              </div>
              <div style="display:inline-block; padding:2px 10px;border-radius:99px; background:${c.fill}22;color:${c.border}; font-weight:600;font-size:12px; margin-bottom:8px">
                ${zone.risk_level.toUpperCase()}
              </div>
              <div style="font-size:13px;color:#64748B; margin-bottom:6px">
                ${zone.reason || 'Weather disruption'}
              </div>
              <div style="font-size:12px;color:#1A1A2E">
                Rainfall: <b>${zone.rainfall_mm}mm</b> · AQI: <b>${zone.aqi}</b>
              </div>
              <div style="margin-top:8px;padding:6px 10px; border-radius:6px;font-size:11px; font-weight:500; background:${zone.risk_level==='extreme'||zone.risk_level==='high'?'#FEE2E2':'#DCFCE7'}; color:${zone.risk_level==='extreme'||zone.risk_level==='high'?'#DC2626':'#16A34A'}">
                ${zone.risk_level==='extreme'||zone.risk_level==='high'?'⚠ Avoid this area for delivery':'✓ Safe to deliver in this area'}
              </div>
            </div>
          `, {maxWidth: 240});

          if(zone.risk_level==='extreme' || zone.risk_level==='high') {
            L.circle([zone.lat, zone.lng], {
              radius: 3200,
              fillColor: c.fill,
              fillOpacity: 0.08,
              color: c.fill,
              weight: 1,
              dashArray: '6 4',
              interactive: false
            }).addTo(layerGroupRef.current!);
          }
        });

        if (STATE_COORDINATES[state]) {
          map.flyTo([STATE_COORDINATES[state].lat, STATE_COORDINATES[state].lng], STATE_COORDINATES[state].zoom);
        }
      } catch (err) {
        console.error("Map rendering error", err);
      }
    };

    renderZones();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [db, workerState]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl border-[0.5px] border-[#E8E6FF] shadow-card overflow-hidden" />
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-[#E8E6FF] shadow-sm space-y-2">
        <p className="text-[10px] font-bold text-[#1A1A2E] uppercase tracking-wider mb-1">Disruption Legend</p>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#DC2626]" /><span className="text-[10px] font-bold text-[#64748B]">EXTREME</span></div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#F97316]" /><span className="text-[10px] font-bold text-[#64748B]">HIGH RISK</span></div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#FBBF24]" /><span className="text-[10px] font-bold text-[#64748B]">MEDIUM</span></div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#4ADE80]" /><span className="text-[10px] font-bold text-[#64748B]">LOW</span></div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[#22C55E]" /><span className="text-[10px] font-bold text-[#64748B]">SAFE</span></div>
      </div>
    </div>
  );
}
