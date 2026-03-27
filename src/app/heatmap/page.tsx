"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { 
  CITIES_LIST,
  getWeatherByCoords,
  getAQIByCoords,
  calculateRisk,
  CityRiskData
} from '@/services/weatherService';

const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#EEEEFF]">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-[#6C47FF]" />
        </div>
        <p className="mt-4 text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest animate-pulse">Initializing Intelligence Map...</p>
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [data, setData] = useState<CityRiskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const fetchAllData = async () => {
    try {
      const results = await Promise.all(CITIES_LIST.map(async (city) => {
        const weather = await getWeatherByCoords(city.lat, city.lng);
        const aqi = await getAQIByCoords(city.lat, city.lng);
        const risk = calculateRisk(weather.rainfall);
        return {
          ...city,
          ...weather,
          aqi: aqi.aqi,
          aqiLabel: aqi.label,
          riskLevel: risk.level as any,
          riskColor: risk.color,
          riskEmoji: risk.emoji,
          percent: risk.percent
        };
      }));
      setData(results);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch heatmap data", error);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Filter Logic: Only pass the matching cities to the Map Component
  const filteredData = useMemo(() => {
    if (activeFilter === 'ALL') return data;
    return data.filter(city => city.riskLevel.toUpperCase() === activeFilter.toUpperCase());
  }, [data, activeFilter]);

  return (
    <div className="h-screen w-full bg-[#EEEEFF] relative overflow-hidden font-body">
      
      {/* Full Width Map Main View */}
      <main className="w-full h-full">
        <MapComponent data={filteredData} />
      </main>

      {/* Small Compact Legend (Bottom Left) */}
      <div className="absolute bottom-10 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-card border border-[#E8E6FF] w-[180px]">
        <p className="text-[10px] font-black text-[#1A1A2E] uppercase tracking-widest mb-3 border-b border-[#E8E6FF] pb-1">Risk Legend</p>
        <div className="space-y-2">
          {[
            { label: 'Extreme (>50mm)', color: '#EF4444' },
            { label: 'High (>30mm)', color: '#F59E0B' },
            { label: 'Medium (>10mm)', color: '#EAB308' },
            { label: 'Low (>0mm)', color: '#22C55E' },
            { label: 'Safe (0mm)', color: '#64748B' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-bold text-[#64748B]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Control Bar (Bottom Center) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-[#E8E6FF] shadow-lg flex gap-1 items-center">
          {['ALL', 'EXTREME', 'HIGH', 'MEDIUM', 'LOW', 'SAFE'].map(r => (
            <button 
              key={r} 
              onClick={() => setActiveFilter(r)} 
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all duration-200 ${
                activeFilter === r 
                  ? 'bg-[#6C47FF] text-white shadow-md scale-105' 
                  : 'hover:bg-[#F5F3FF] text-[#64748B]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Sync Status Overlay */}
      {isLoading && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border border-[#E8E6FF] flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-[#6C47FF]" />
          <span className="text-[10px] font-black text-[#6C47FF] tracking-widest uppercase">Updating Risk Matrix...</span>
        </div>
      )}
    </div>
  );
}
