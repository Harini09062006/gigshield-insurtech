"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Shield, Search, Loader2, Home, LogOut, 
  Map as MapIcon, RefreshCw, Info, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  CityRiskData, 
  getWeatherByCoords, 
  getAQIByCoords, 
  calculateRisk,
  CITIES_LIST
} from '@/services/weatherService';

const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F3FF]">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-[#6C47FF]" />
          <Shield className="h-6 w-6 text-[#6C47FF] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-6 text-sm font-bold text-[#6C47FF] uppercase tracking-widest animate-pulse">Syncing Global Weather Core...</p>
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [data, setData] = useState<CityRiskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [suggestions, setSuggestions] = useState<typeof CITIES_LIST>([]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 1) {
      setSuggestions(CITIES_LIST.filter(c => c.name.toLowerCase().includes(query.toLowerCase())));
    } else {
      setSuggestions([]);
    }
  };

  const selectCity = (city: typeof CITIES_LIST[0]) => {
    setSearchQuery(city.name);
    setSuggestions([]);
    const map = (window as any).leafletMap;
    const markers = (window as any).cityMarkers;
    if (map && markers && markers[city.name.toLowerCase()]) {
      map.flyTo([city.lat, city.lng], 10, { duration: 1.5 });
      setTimeout(() => {
        markers[city.name.toLowerCase()].openPopup();
      }, 1600);
    }
  };

  return (
    <div className="h-screen w-full bg-[#EEEEFF] flex flex-col overflow-hidden font-body">
      
      {/* Header */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white z-[2000] shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A2E] tracking-tight">GigShield</span>
          </div>
          <div className="h-8 w-[1px] bg-[#E8E6FF]" />
          <div className="flex flex-col">
            <span className="text-sm font-black text-[#6C47FF] tracking-tighter uppercase">🗺️ Risk Heat Intelligence</span>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] font-bold text-[#22C55E]">LIVE ENGINE ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C47FF]" />
            <input 
              placeholder="Search city..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-[#F8F9FF] border-2 border-[#E8E6FF] rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#6C47FF] transition-all" 
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-[#E8E6FF] rounded-xl mt-2 shadow-2xl overflow-hidden z-[3000]">
                {suggestions.map(s => (
                  <button key={s.name} onClick={() => selectCity(s)} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-[#F5F3FF] transition-colors flex items-center gap-2">
                    <MapIcon className="h-3 w-3 text-[#6C47FF]" /> {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B] hover:bg-[#F5F3FF] rounded-xl"><Home /></Button></Link>
            <Button onClick={() => auth.signOut().then(()=>router.push("/"))} variant="ghost" size="icon" className="text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl"><LogOut /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Map Section */}
        <section className="flex-1 relative h-full">
          <MapComponent data={data} riskFilter={riskFilter} />

          {/* Legend */}
          <div className="absolute bottom-10 left-8 z-[1000] bg-white border-2 border-[#E8E6FF] p-5 rounded-[20px] shadow-2xl min-w-[200px]">
            <p className="text-[11px] font-black text-[#1A1A2E] uppercase tracking-widest mb-4 border-b border-[#E8E6FF] pb-2">Disruption Legend</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><div className="h-3.5 w-3.5 rounded-full bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Extreme Risk (&gt;50mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3.5 w-3.5 rounded-full bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.4)]" /><span className="text-[10px] font-bold text-[#1A1A2E]">High Risk (&gt;30mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3.5 w-3.5 rounded-full bg-[#EAB308]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Medium Risk (&gt;10mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3.5 w-3.5 rounded-full bg-[#22C55E]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Low Risk (&gt;0mm)</span></div>
              <div className="flex items-center gap-3"><div className="h-3.5 w-3.5 rounded-full bg-[#64748B]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Safe Zone (0mm)</span></div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="bg-white p-2 rounded-2xl border-2 border-[#E8E6FF] shadow-2xl flex gap-1 items-center">
              <span className="text-[9px] font-black uppercase text-[#64748B] px-3">Filter:</span>
              {['all', 'extreme', 'high', 'medium', 'low', 'safe'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setRiskFilter(r)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${riskFilter === r ? 'bg-[#6C47FF] text-white shadow-btn' : 'hover:bg-[#F5F3FF] text-[#64748B]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#E8E6FF] shadow-xl flex items-center gap-3">
              <RefreshCw className={`h-3 w-3 text-[#6C47FF] ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-bold text-[#64748B]">Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
