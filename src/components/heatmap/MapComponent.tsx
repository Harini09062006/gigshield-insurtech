
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, AlertTriangle, Wind, CloudRain, Droplets } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Leaflet Icon Fix
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });
}

const RISK_COLORS: Record<string, { fill: string; border: string; label: string; text: string }> = {
  extreme: { fill: '#DC2626', border: '#991B1B', label: 'EXTREME DANGER', text: '#DC2626' },
  high: { fill: '#F97316', border: '#C2410C', label: 'HIGH RISK', text: '#F97316' },
  medium: { fill: '#FBBF24', border: '#D97706', label: 'MEDIUM RISK', text: '#D97706' },
  low: { fill: '#4ADE80', border: '#16A34A', label: 'LOW RISK', text: '#16A34A' },
  safe: { fill: '#22C55E', border: '#15803D', label: 'SAFE ZONE', text: '#22C55E' },
};

const SEED_DATA = [
  { id: '1', zone: "South Mumbai", city: "Mumbai", lat: 18.9322, lng: 72.8264, risk_score: 85, risk_level: "extreme", rainfall_mm: 72, aqi: 210, reason: "Heavy flooding + high AQI", radius_km: 1.8 },
  { id: '2', zone: "Kurla", city: "Mumbai", lat: 19.0726, lng: 72.8795, risk_score: 74, risk_level: "high", rainfall_mm: 58, aqi: 185, reason: "Waterlogging reported", radius_km: 1.5 },
  { id: '3', zone: "Dharavi", city: "Mumbai", lat: 19.0401, lng: 72.8543, risk_score: 78, risk_level: "high", rainfall_mm: 63, aqi: 195, reason: "Road closures + heavy rain", radius_km: 1.2 },
  { id: '4', zone: "Andheri", city: "Mumbai", lat: 19.1197, lng: 72.8469, risk_score: 52, risk_level: "medium", rainfall_mm: 38, aqi: 155, reason: "Moderate rainfall", radius_km: 2.0 },
  { id: '5', zone: "Bandra", city: "Mumbai", lat: 19.0544, lng: 72.8405, risk_score: 48, risk_level: "medium", rainfall_mm: 34, aqi: 148, reason: "Slow traffic + rain", radius_km: 1.6 },
  { id: '6', zone: "Dadar", city: "Mumbai", lat: 19.0178, lng: 72.8478, risk_score: 28, risk_level: "low", rainfall_mm: 18, aqi: 95, reason: "Light drizzle only", radius_km: 1.4 },
  { id: '7', zone: "Powai", city: "Mumbai", lat: 19.1197, lng: 72.9050, risk_score: 22, risk_level: "low", rainfall_mm: 12, aqi: 88, reason: "Mostly clear", radius_km: 1.8 },
  { id: '8', zone: "Thane", city: "Mumbai", lat: 19.2183, lng: 72.9781, risk_score: 10, risk_level: "safe", rainfall_mm: 5, aqi: 62, reason: "Clear skies", radius_km: 2.2 },
  { id: '9', zone: "Borivali", city: "Mumbai", lat: 19.2307, lng: 72.8567, risk_score: 15, risk_level: "safe", rainfall_mm: 8, aqi: 70, reason: "No disruptions", radius_km: 2.0 },
  { id: '10', zone: "Malad", city: "Mumbai", lat: 19.1871, lng: 72.8487, risk_score: 61, risk_level: "high", rainfall_mm: 55, aqi: 172, reason: "Flooding near subway", radius_km: 1.6 }
];

function MapController({ searchQuery, zones }: { searchQuery: string; zones: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!searchQuery) return;
    const match = zones.find(z => z.zone.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) {
      map.flyTo([match.lat, match.lng], 14, { duration: 1.5 });
    }
  }, [searchQuery, zones, map]);

  return null;
}

export default function MapComponent({ searchQuery }: { searchQuery: string }) {
  const db = useFirestore();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const zonesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "disruption_zones"), where("city", "==", "Mumbai"));
  }, [db]);

  const { data: dbZones, isLoading } = useCollection(zonesQuery);

  const zones = useMemo(() => {
    const raw = (dbZones && dbZones.length > 0) ? dbZones : SEED_DATA;
    if (!searchQuery) return raw;
    return raw.map(z => ({
      ...z,
      opacity: z.zone.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0.2
    }));
  }, [dbZones, searchQuery]);

  useEffect(() => {
    if (!isLoading) setLastUpdated(new Date());
  }, [dbZones, isLoading]);

  const stats = useMemo(() => {
    const counts = { extreme: 0, high: 0, medium: 0, safe: 0 };
    zones.forEach(z => {
      if (counts[z.risk_level as keyof typeof counts] !== undefined) {
        counts[z.risk_level as keyof typeof counts]++;
      } else if (z.risk_level === 'low') {
        counts.safe++;
      }
    });
    return counts;
  }, [zones]);

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

      <div className="relative flex-1 min-h-[500px] w-full rounded-card overflow-hidden shadow-card border border-border bg-white">
        <MapContainer 
          center={[19.0760, 72.8777]} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController searchQuery={searchQuery} zones={zones} />
          
          {zones.map((zone) => {
            const colors = RISK_COLORS[zone.risk_level] || RISK_COLORS.safe;
            const isMatching = searchQuery && zone.zone.toLowerCase().includes(searchQuery.toLowerCase());
            
            return (
              <div key={zone.id}>
                {/* Pulse Ring for Extreme/High */}
                {(zone.risk_level === 'extreme' || zone.risk_level === 'high') && (
                  <Circle
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius_km * 1400}
                    pathOptions={{
                      fillColor: colors.fill,
                      color: colors.fill,
                      fillOpacity: 0.2,
                      stroke: false,
                      className: 'pulse-ring'
                    }}
                  />
                )}
                
                {/* Main Danger Circle */}
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius_km * 1000}
                  pathOptions={{
                    fillColor: colors.fill,
                    color: isMatching ? '#FFFFFF' : colors.border,
                    fillOpacity: zone.opacity ?? (colors as any).opacity ?? 0.5,
                    weight: isMatching ? 4 : 2,
                  }}
                >
                  <Tooltip permanent={false} direction="center" className="bg-transparent border-none shadow-none">
                    <Badge className="bg-white text-heading font-bold shadow-sm border-l-4" style={{ borderLeftColor: colors.fill }}>
                      {zone.zone}
                    </Badge>
                  </Tooltip>
                  
                  <Popup minWidth={260} className="custom-popup">
                    <div className="p-1 space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-headline font-bold text-lg text-heading">{zone.zone}</h3>
                        <Badge style={{ backgroundColor: colors.fill, color: '#FFF' }}>{zone.risk_level.toUpperCase()}</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-bold text-body">
                            <span>Rainfall</span>
                            <span>{zone.rainfall_mm}mm</span>
                          </div>
                          <Progress value={Math.min(100, zone.rainfall_mm)} className="h-1.5 bg-muted" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-[10px] text-muted font-bold uppercase">AQI</p>
                              <p className="text-xs font-bold text-heading">{zone.aqi}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-[10px] text-muted font-bold uppercase">Risk Score</p>
                              <p className="text-xs font-bold text-heading">{zone.risk_score}/100</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-muted/30 rounded-md border border-border/50 text-xs text-body leading-relaxed">
                        {zone.reason}
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-primary text-white rounded-btn text-xs font-bold shadow-btn">Get Covered</button>
                        <button className="flex-1 py-2 bg-white border border-primary text-primary rounded-btn text-xs font-bold">View Claim</button>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              </div>
            );
          })}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-card border border-border shadow-lg min-w-[180px]">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Risk Level Guide</h4>
          <div className="space-y-2">
            {Object.entries(RISK_COLORS).map(([level, colors]) => (
              <div key={level} className="flex items-center gap-3 text-xs font-medium text-heading">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.fill }} />
                <span className="capitalize">{level} Risk</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Info */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full border border-border shadow-sm text-[10px] font-mono text-muted uppercase tracking-widest">
          Sync Status: {isLoading ? 'Updating...' : `Updated ${lastUpdated.toLocaleTimeString()}`}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
          transform-origin: center;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px;
        }
        .custom-popup .leaflet-popup-tip {
          background: #FFF;
        }
      `}</style>
    </div>
  );
}
