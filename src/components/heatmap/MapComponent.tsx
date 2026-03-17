'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Zap, AlertTriangle, CloudRain, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MapComponent({ searchQuery }: { searchQuery: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesRef = useRef<L.LayerGroup | null>(null);
  const [lastUpdated] = useState<Date>(new Date());

  const zones = [
    { name: "South Mumbai", lat: 18.9322, lng: 72.8264, risk: "extreme", score: 85, color: "#DC2626", dark: "#991B1B", radius: 2000, info: "Heavy flooding + high AQI" },
    { name: "Kurla", lat: 19.0726, lng: 72.8795, risk: "high", score: 74, color: "#F97316", dark: "#C2410C", radius: 1800, info: "Waterlogging reported" },
    { name: "Dharavi", lat: 19.0401, lng: 72.8543, risk: "high", score: 78, color: "#F97316", dark: "#C2410C", radius: 1600, info: "Road closures + heavy rain" },
    { name: "Malad", lat: 19.1871, lng: 72.8487, risk: "high", score: 65, color: "#F97316", dark: "#C2410C", radius: 1700, info: "Flooding near subway" },
    { name: "Andheri", lat: 19.1197, lng: 72.8469, risk: "medium", score: 52, color: "#FBBF24", dark: "#D97706", radius: 1800, info: "Moderate rainfall" },
    { name: "Bandra", lat: 19.0544, lng: 72.8405, risk: "medium", score: 48, color: "#FBBF24", dark: "#D97706", radius: 1500, info: "Slow traffic + rain" },
    { name: "Dadar", lat: 19.0178, lng: 72.8478, risk: "low", score: 28, color: "#4ADE80", dark: "#16A34A", radius: 1400, info: "Light drizzle only" },
    { name: "Powai", lat: 19.1197, lng: 72.9050, risk: "low", score: 22, color: "#4ADE80", dark: "#16A34A", radius: 1600, info: "Mostly clear" },
    { name: "Borivali", lat: 19.2307, lng: 72.8567, risk: "safe", score: 10, color: "#22C55E", dark: "#15803D", radius: 1800, info: "No disruptions" },
    { name: "Thane", lat: 19.2183, lng: 72.9781, risk: "safe", score: 12, color: "#22C55E", dark: "#15803D", radius: 2000, info: "Clear skies" },
  ];

  // Initialize Map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.0760, 72.8777],
      zoom: 11,
      minZoom: 10,
      maxZoom: 16,
      zoomControl: true,
      maxBounds: [
        [18.85, 72.70],
        [19.35, 73.10]
      ],
      maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    circlesRef.current = L.layerGroup().addTo(map);

    // Initial render of zones
    renderZones(zones, '');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Search and Filtering
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    renderZones(zones, searchQuery);

    if (searchQuery) {
      const match = zones.find(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (match) {
        mapInstanceRef.current.flyTo([match.lat, match.lng], 14, { duration: 1.5 });
      }
    } else {
      mapInstanceRef.current.setView([19.0760, 72.8777], 11);
    }
  }, [searchQuery]);

  function renderZones(data: any[], filter: string) {
    if (!circlesRef.current || !mapInstanceRef.current) return;
    circlesRef.current.clearLayers();

    data.forEach(zone => {
      const isMatch = filter === '' || zone.name.toLowerCase().includes(filter.toLowerCase());
      const opacity = filter === '' || isMatch ? 0.55 : 0.15;
      const weight = isMatch && filter !== '' ? 4 : 2;
      const borderColor = isMatch && filter !== '' ? '#FFFFFF' : zone.dark;

      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        fillColor: zone.color,
        fillOpacity: opacity,
        color: borderColor,
        weight: weight,
      });

      circle.bindPopup(`
        <div style="min-width:200px;font-family:Inter,sans-serif;padding:4px">
          <div style="font-weight:700;font-size:15px;color:#1A1A2E;margin-bottom:6px">
            ${zone.name}
          </div>
          <div style="display:inline-block;padding:2px 10px;border-radius:99px;background:${zone.color}22;color:${zone.dark};font-weight:600;font-size:12px;margin-bottom:8px;border:1px solid ${zone.color}44">
            ${zone.risk.toUpperCase()}
          </div>
          <div style="font-size:13px;color:#64748B;margin-bottom:8px;line-height:1.4">${zone.info}</div>
          <div style="font-size:13px;color:#1A1A2E;padding-top:8px;border-top:1px solid #E2E8F0">
            Risk Score: <b style="color:${zone.dark}">${zone.score}/100</b>
          </div>
          <button style="width:100%;margin-top:12px;background:#6C47FF;color:white;border:none;padding:8px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer">GET COVERED</button>
        </div>
      `);

      circle.addTo(circlesRef.current!);

      // Add Pulse Ring for High/Extreme
      if (zone.risk === 'extreme' || zone.risk === 'high') {
        const pulse = L.circle([zone.lat, zone.lng], {
          radius: zone.radius * 1.5,
          fillColor: zone.color,
          fillOpacity: filter === '' || isMatch ? 0.08 : 0.02,
          color: zone.color,
          weight: 1,
          dashArray: '6 4',
        });
        pulse.addTo(circlesRef.current!);
      }
    });
  }

  const stats = {
    extreme: zones.filter(z => z.risk === 'extreme').length,
    high: zones.filter(z => z.risk === 'high').length,
    medium: zones.filter(z => z.risk === 'medium').length,
    safe: zones.filter(z => z.risk === 'safe' || z.risk === 'low').length,
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Badge variant="outline" className="bg-[#DC2626]/10 border-[#DC2626] text-[#DC2626] px-4 py-2 rounded-full font-bold whitespace-nowrap">
          <AlertTriangle className="mr-2 h-4 w-4" /> {stats.extreme} Extreme zones
        </Badge>
        <Badge variant="outline" className="bg-[#F97316]/10 border-[#F97316] text-[#F97316] px-4 py-2 rounded-full font-bold whitespace-nowrap">
          <Zap className="mr-2 h-4 w-4" /> {stats.high} High risk zones
        </Badge>
        <Badge variant="outline" className="bg-[#FBBF24]/10 border-[#FBBF24] text-[#D97706] px-4 py-2 rounded-full font-bold whitespace-nowrap">
          <CloudRain className="mr-2 h-4 w-4" /> {stats.medium} Medium zones
        </Badge>
        <Badge variant="outline" className="bg-[#22C55E]/10 border-[#22C55E] text-[#15803D] px-4 py-2 rounded-full font-bold whitespace-nowrap">
          <Shield className="mr-2 h-4 w-4" /> {stats.safe} Safe zones
        </Badge>
      </div>

      <div className="relative flex-1 w-full rounded-card overflow-hidden shadow-card border border-border bg-white" style={{ minHeight: '520px', height: 'calc(100vh - 160px)', zIndex: 1 }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-card border border-border shadow-lg min-w-[180px]">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Risk Level Guide</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs font-medium text-heading">
              <div className="h-3 w-3 rounded-full bg-[#DC2626]" />
              <span>Extreme Danger</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-heading">
              <div className="h-3 w-3 rounded-full bg-[#F97316]" />
              <span>High Risk</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-heading">
              <div className="h-3 w-3 rounded-full bg-[#FBBF24]" />
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-heading">
              <div className="h-3 w-3 rounded-full bg-[#4ADE80]" />
              <span>Low Risk</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-heading">
              <div className="h-3 w-3 rounded-full bg-[#22C55E]" />
              <span>Safe Zone</span>
            </div>
          </div>
        </div>

        {/* Sync Info */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full border border-border shadow-sm text-[10px] font-mono text-muted uppercase tracking-widest">
          Sync Status: LIVE • Updated {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #f8fafc;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .leaflet-popup-content {
          margin: 12px;
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}
