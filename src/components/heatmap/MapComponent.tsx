
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Zap, AlertTriangle, CloudRain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const FALLBACK_ZONES = [
  { zone_name: "South Mumbai", lat: 18.9322, lng: 72.8264, risk_level: "extreme", risk_score: 85, color: "#DC2626", dark: "#991B1B", radius_km: 2.0, reason: "Heavy flooding + high AQI" },
  { zone_name: "Kurla", lat: 19.0726, lng: 72.8795, risk_level: "high", risk_score: 74, color: "#F97316", dark: "#C2410C", radius_km: 1.8, reason: "Waterlogging reported" },
  { zone_name: "Dharavi", lat: 19.0401, lng: 72.8543, risk_level: "high", risk_score: 78, color: "#F97316", dark: "#C2410C", radius_km: 1.6, reason: "Road closures + heavy rain" },
  { zone_name: "Malad", lat: 19.1871, lng: 72.8487, risk_level: "high", risk_score: 65, color: "#F97316", dark: "#C2410C", radius_km: 1.7, reason: "Flooding near subway" },
  { zone_name: "Andheri", lat: 19.1197, lng: 72.8469, risk_level: "medium", risk_score: 52, color: "#FBBF24", dark: "#D97706", radius_km: 1.8, reason: "Moderate rainfall" },
  { zone_name: "Bandra", lat: 19.0544, lng: 72.8405, risk_level: "medium", risk_score: 48, color: "#FBBF24", dark: "#D97706", radius_km: 1.5, reason: "Slow traffic + rain" },
  { zone_name: "Dadar", lat: 19.0178, lng: 72.8478, risk_level: "low", risk_score: 28, color: "#4ADE80", dark: "#16A34A", radius_km: 1.4, reason: "Light drizzle only" },
  { zone_name: "Powai", lat: 19.1197, lng: 72.9050, risk_level: "low", risk_score: 22, color: "#4ADE80", dark: "#16A34A", radius_km: 1.6, reason: "Mostly clear" },
  { zone_name: "Borivali", lat: 19.2307, lng: 72.8567, risk_level: "safe", risk_score: 10, color: "#22C55E", dark: "#15803D", radius_km: 1.8, reason: "No disruptions" },
  { zone_name: "Thane", lat: 19.2183, lng: 72.9781, risk_level: "safe", risk_score: 12, color: "#22C55E", dark: "#15803D", radius_km: 2.0, reason: "Clear skies" },
];

export default function MapComponent({ searchQuery }: { searchQuery: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesRef = useRef<L.LayerGroup | null>(null);
  const [lastUpdated] = useState<Date>(new Date());

  const db = useFirestore();
  const zonesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "disruption_zones");
  }, [db]);

  const { data: dbZones } = useCollection(zonesQuery);

  const zones = useMemo(() => {
    if (dbZones && dbZones.length > 0) return dbZones;
    return FALLBACK_ZONES;
  }, [dbZones]);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.0760, 72.8777],
      zoom: 11,
      minZoom: 10,
      maxZoom: 16,
      zoomControl: true,
      maxBounds: [[18.85, 72.70], [19.35, 73.10]],
      maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    circlesRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !circlesRef.current) return;
    renderZones(zones, searchQuery);

    if (searchQuery) {
      const match = zones.find(z => (z.zone_name || z.zone).toLowerCase().includes(searchQuery.toLowerCase()));
      if (match) {
        mapInstanceRef.current.flyTo([match.lat, match.lng], 14, { duration: 1.5 });
      }
    } else {
      mapInstanceRef.current.setView([19.0760, 72.8777], 11);
    }
  }, [searchQuery, zones]);

  function renderZones(data: any[], filter: string) {
    if (!circlesRef.current || !mapInstanceRef.current) return;
    circlesRef.current.clearLayers();

    data.forEach(zone => {
      const name = zone.zone_name || zone.zone;
      const isMatch = filter === '' || name.toLowerCase().includes(filter.toLowerCase());
      
      const riskColors: any = {
        extreme: { color: "#DC2626", dark: "#991B1B" },
        high: { color: "#F97316", dark: "#C2410C" },
        medium: { color: "#FBBF24", dark: "#D97706" },
        low: { color: "#4ADE80", dark: "#16A34A" },
        safe: { color: "#22C55E", dark: "#15803D" }
      };

      const colors = riskColors[zone.risk_level] || riskColors.safe;
      const opacity = filter === '' || isMatch ? 0.55 : 0.15;
      const radius = (zone.radius_km || 1.5) * 1000;

      const circle = L.circle([zone.lat, zone.lng], {
        radius: radius,
        fillColor: colors.color,
        fillOpacity: opacity,
        color: isMatch && filter !== '' ? '#FFFFFF' : colors.dark,
        weight: isMatch && filter !== '' ? 4 : 2,
      });

      circle.bindPopup(`
        <div style="min-width:200px;font-family:Inter,sans-serif;padding:4px">
          <div style="font-weight:700;font-size:15px;color:#1A1A2E;margin-bottom:6px">
            ${name}
          </div>
          <div style="display:inline-block;padding:2px 10px;border-radius:99px;background:${colors.color}22;color:${colors.dark};font-weight:600;font-size:12px;margin-bottom:8px;border:1px solid ${colors.color}44">
            ${zone.risk_level.toUpperCase()}
          </div>
          <div style="font-size:13px;color:#64748B;margin-bottom:8px;line-height:1.4">${zone.reason || 'Active monitoring zone'}</div>
          <div style="font-size:13px;color:#1A1A2E;padding-top:8px;border-top:1px solid #E2E8F0">
            Risk Score: <b style="color:${colors.dark}">${zone.risk_score || 'N/A'}/100</b>
          </div>
          <button style="width:100%;margin-top:12px;background:#6C47FF;color:white;border:none;padding:8px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer">GET COVERED</button>
        </div>
      `);

      circle.addTo(circlesRef.current!);

      if (zone.risk_level === 'extreme' || zone.risk_level === 'high') {
        const pulse = L.circle([zone.lat, zone.lng], {
          radius: radius * 1.5,
          fillColor: colors.color,
          fillOpacity: filter === '' || isMatch ? 0.08 : 0.02,
          color: colors.color,
          weight: 1,
          dashArray: '6 4',
        });
        pulse.addTo(circlesRef.current!);
      }
    });
  }

  const stats = {
    extreme: zones.filter(z => z.risk_level === 'extreme').length,
    high: zones.filter(z => z.risk_level === 'high').length,
    medium: zones.filter(z => z.risk_level === 'medium').length,
    safe: zones.filter(z => z.risk_level === 'safe' || z.risk_level === 'low').length,
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
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
              <div className="h-3 w-3 rounded-full bg-[#22C55E]" />
              <span>Safe Zone</span>
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full border border-border shadow-sm text-[10px] font-mono text-muted uppercase tracking-widest">
          Sync Status: LIVE • Updated {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container { background: #EEEEFF; }
        .leaflet-popup-content-wrapper { border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 10px 25px rgba(108, 71, 255, 0.1); }
        .leaflet-popup-content { margin: 12px; }
        .leaflet-popup-tip { background: white; }
      `}</style>
    </div>
  );
}
