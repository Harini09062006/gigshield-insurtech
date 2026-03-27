"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Shield, Search, Loader2, Home, LogOut, 
  BarChart3, CloudRain, Map as MapIcon, 
  RefreshCw, Layers, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  CityRiskData, 
  getWeatherByCoords, 
  getAQIByCoords, 
  calculateRisk 
} from '@/services/weatherService';

const CITIES_LIST = [
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Howrah", lat: 22.5958, lng: 88.2636 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 }
];

const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F3FF]">
        <Loader2 className="h-12 w-12 animate-spin text-[#6C47FF]" />
        <p className="mt-4 text-sm font-bold text-[#6C47FF] uppercase tracking-widest">Initializing Map Engine...</p>
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [data, setData] = useState<CityRiskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('all');
  const [activeLayer, setActiveLayer] = useState<'base' | 'rain'>('base');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const auth = useAuth();
  const router = useRouter();

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
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch heatmap data", error);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => ({
    extreme: data.filter(c => c.riskLevel === 'EXTREME').length,
    high: data.filter(c => c.riskLevel === 'HIGH').length,
    medium: data.filter(c => c.riskLevel === 'MEDIUM').length,
    safe: data.filter(c => c.riskLevel === 'SAFE').length,
    highestRain: [...data].sort((a,b) => b.rainfall - a.rainfall)[0],
    worstAQI: [...data].sort((a,b) => b.aqi - a.aqi)[0]
  }), [data]);

  return (
    <div className="h-screen w-full bg-[#EEEEFF] flex flex-col overflow-hidden font-body">
      
      {/* Header */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A2E]">GigShield</span>
          </div>
          <div className="h-8 w-[1px] bg-[#E8E6FF]" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#6C47FF] tracking-tight uppercase">🗺️ Risk Heat Intelligence</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] font-bold text-[#22C55E]">LIVE ENGINE ACTIVE</span>
              <span className="text-[10px] text-[#64748B]">· Syncing disruption data...</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C47FF]" />
            <input 
              placeholder="Search city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FF] border border-[#E8E6FF] rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#6C47FF] transition-all" 
            />
          </div>
          <span className="text-[10px] text-[#64748B] hidden md:inline">Last updated: {Math.floor((new Date().getTime() - lastUpdated.getTime())/60000)} mins ago 🔄</span>
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B] hover:bg-[#F5F3FF]"><Home /></Button></Link>
          <Button onClick={() => auth.signOut().then(()=>router.push("/"))} variant="ghost" size="icon" className="text-[#EF4444] hover:bg-[#FEE2E2]"><LogOut /></Button>
        </div>
      </header>

      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Map Section */}
        <section className="flex-1 relative h-full">
          <MapComponent 
            data={data} 
            riskFilter={riskFilter} 
            activeLayer={activeLayer}
            searchQuery={searchQuery}
          />

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-white border border-[#6C47FF] p-4 rounded-xl shadow-xl min-w-[180px]">
            <p className="text-xs font-black text-[#1A1A2E] uppercase tracking-widest mb-3 border-b border-[#E8E6FF] pb-2">Disruption Legend</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#EF4444]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Extreme Risk (&gt;50mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#F59E0B]" /><span className="text-[10px] font-bold text-[#1A1A2E]">High Risk (&gt;30mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#EAB308]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Medium Risk (&gt;10mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#22C55E]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Low Risk (&gt;0mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-[#64748B]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Safe Zone (0mm)</span></div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-4 items-center">
            <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl border border-[#E8E6FF] shadow-2xl flex gap-1">
              {['all', 'extreme', 'high', 'medium', 'low', 'safe'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setRiskFilter(r)} 
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${riskFilter === r ? 'bg-[#6C47FF] text-white' : 'hover:bg-[#F5F3FF] text-[#64748B]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Toggle */}
          <div className="absolute bottom-6 right-6 z-[1000] bg-white border border-[#E8E6FF] p-2 rounded-xl shadow-xl flex gap-1">
            <button 
              onClick={() => setActiveLayer('base')} 
              className={`p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase transition-all ${activeLayer === 'base' ? 'bg-[#6C47FF] text-white' : 'text-[#64748B]'}`}
            >
              <MapIcon className="h-3 w-3" /> Base
            </button>
            <button 
              onClick={() => setActiveLayer('rain')} 
              className={`p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase transition-all ${activeLayer === 'rain' ? 'bg-[#6C47FF] text-white' : 'text-[#64748B]'}`}
            >
              <CloudRain className="h-3 w-3" /> Rain
            </button>
          </div>
        </section>

        {/* Sidebar Dashboard */}
        <aside className="w-[300px] bg-white border-l border-[#E8E6FF] overflow-y-auto hidden lg:flex flex-col">
          <div className="p-6 bg-[#6C47FF] text-white flex items-center gap-3">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-sm font-black tracking-widest uppercase">Live Risk Dashboard</h2>
          </div>
          
          <div className="p-6 space-y-8 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#F8F9FF] border border-red-100 rounded-lg">
                <p className="text-[9px] font-bold text-[#EF4444] uppercase mb-1">🔴 Extreme</p>
                <p className="text-xl font-black text-[#1A1A2E]">{stats.extreme}</p>
              </div>
              <div className="p-3 bg-[#F8F9FF] border border-orange-100 rounded-lg">
                <p className="text-[9px] font-bold text-[#F59E0B] uppercase mb-1">🟠 High</p>
                <p className="text-xl font-black text-[#1A1A2E]">{stats.high}</p>
              </div>
              <div className="p-3 bg-[#F8F9FF] border border-yellow-100 rounded-lg">
                <p className="text-[9px] font-bold text-[#EAB308] uppercase mb-1">🟡 Medium</p>
                <p className="text-xl font-black text-[#1A1A2E]">{stats.medium}</p>
              </div>
              <div className="p-3 bg-[#F8F9FF] border border-gray-100 rounded-lg">
                <p className="text-[9px] font-bold text-[#64748B] uppercase mb-1">⚫ Safe</p>
                <p className="text-xl font-black text-[#1A1A2E]">{stats.safe}</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[#E8E6FF]">
              <h3 className="text-[10px] font-black text-[#6C47FF] uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="h-3 w-3" /> Meteorological Extremes
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#F5F3FF] rounded-lg border border-[#E8E6FF]">
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">🌧️ Highest Rainfall</p>
                  <p className="text-sm font-bold text-[#1A1A2E]">{stats.highestRain?.name || "--"} — {stats.highestRain?.rainfall || 0}mm</p>
                </div>
                <div className="p-3 bg-[#F5F3FF] rounded-lg border border-[#E8E6FF]">
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">💨 Worst Air Quality</p>
                  <p className="text-sm font-bold text-[#1A1A2E]">{stats.worstAQI?.name || "--"} — Level {stats.worstAQI?.aqi || 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-[#E8E6FF]">
              <div className="bg-[#6C47FF]/5 p-4 rounded-xl border border-[#6C47FF]/20 flex gap-3">
                <Info className="h-5 w-5 text-[#6C47FF] shrink-0" />
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Real-time disruption analysis is derived from OpenWeatherMap atmospheric data. Risk levels are recalculated every 120 seconds.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-[#F8F9FF] border-t border-[#E8E6FF] text-center">
            <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-widest">Operations Center v2.4</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
