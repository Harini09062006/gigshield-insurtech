"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Shield, Search, Loader2, Home, LogOut, 
  Map as MapIcon, RefreshCw
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
          <Loader2 className="h-12 w-12 animate-spin text-[#6C47FF]" />
          <Shield className="h-5 w-5 text-[#6C47FF] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest animate-pulse">Initializing Global Risk Matrix...</p>
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
    const interval = setInterval(fetchAllData, 120000);
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
      
      {/* Precision Operations Header */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-[#E8E6FF] bg-white z-[2000] shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-[#6C47FF] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#1A1A2E] tracking-tight">GigShield</span>
          </Link>
          <div className="h-6 w-[1px] bg-[#E8E6FF]" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-[#6C47FF] tracking-widest uppercase">🗺️ RISK HEAT INTELLIGENCE</span>
            <div className="flex items-center gap-1.5 bg-[#DCFCE7] px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[9px] font-bold text-[#22C55E]">LIVE ENGINE ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6C47FF]" />
            <input 
              placeholder="Search operational city..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-[#F8F9FF] border border-[#E8E6FF] rounded-lg pl-9 pr-4 py-1.5 text-[11px] font-bold focus:outline-none focus:border-[#6C47FF] transition-all" 
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-[#E8E6FF] rounded-lg mt-1 shadow-xl overflow-hidden z-[3000]">
                {suggestions.map(s => (
                  <button key={s.name} onClick={() => selectCity(s)} className="w-full px-3 py-2 text-left text-[10px] font-bold hover:bg-[#F5F3FF] transition-colors flex items-center gap-2">
                    <MapIcon className="h-3 w-3 text-[#6C47FF]" /> {s.name}, {s.state}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748B] hover:bg-[#F5F3FF] rounded-lg"><Home size={16} /></Button></Link>
            <Button onClick={() => auth.signOut().then(()=>router.push("/"))} variant="ghost" size="icon" className="h-8 w-8 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg"><LogOut size={16} /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        
        {/* Full Screen Tactical Map */}
        <section className="absolute inset-0">
          <MapComponent data={data} riskFilter={riskFilter} />

          {/* Tactical Legend (Bottom Left) */}
          <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 backdrop-blur-md border border-[#E8E6FF] p-4 rounded-xl shadow-lg min-w-[180px]">
            <p className="text-[10px] font-black text-[#1A1A2E] uppercase tracking-widest mb-3 border-b border-[#E8E6FF] pb-2">Precitiptation Legend</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#EF4444]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Extreme (&gt;50mm)</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#F59E0B]" /><span className="text-[10px] font-bold text-[#1A1A2E]">High (30–50mm)</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#EAB308]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Medium (10–30mm)</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#22C55E]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Low (1–10mm)</span></div>
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#64748B]" /><span className="text-[10px] font-bold text-[#1A1A2E]">Safe (0mm)</span></div>
            </div>
          </div>

          {/* Tactical Filter Bar (Bottom Center) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-full border border-[#E8E6FF] shadow-lg flex gap-1 items-center">
              {['all', 'extreme', 'high', 'medium', 'low', 'safe'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setRiskFilter(r)} 
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${riskFilter === r ? 'bg-[#6C47FF] text-white shadow-md' : 'hover:bg-[#F5F3FF] text-[#64748B]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Sync Indicator */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#E8E6FF] shadow-md flex items-center gap-3">
              <RefreshCw className={`h-3 w-3 text-[#6C47FF] ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
