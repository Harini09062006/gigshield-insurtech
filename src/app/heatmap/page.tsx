"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Shield, Search, Loader2, Home, LogOut, 
  Map as MapIcon, RefreshCw, FileDown, Bell
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
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
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

  // ── FILTERING LOGIC ──────────────────────────────────────
  const filteredData = useMemo(() => {
    const normalizedData = data.map(city => ({
      ...city,
      riskLevel: (city.riskLevel || 'SAFE').toUpperCase() as any
    }));

    if (activeFilter === 'ALL') return normalizedData;
    const filtered = normalizedData.filter(city => city.riskLevel === activeFilter);
    
    console.log("Active Filter:", activeFilter);
    console.log("Filtered Results:", filtered.length);
    
    return filtered;
  }, [data, activeFilter]);

  const stats = useMemo(() => {
    return {
      extreme: data.filter(c => c.riskLevel === 'EXTREME').length,
      high: data.filter(c => c.riskLevel === 'HIGH').length,
      medium: data.filter(c => c.riskLevel === 'MEDIUM').length,
      safe: data.filter(c => c.riskLevel === 'SAFE' || c.riskLevel === 'LOW').length,
      highestRain: [...data].sort((a, b) => b.rainfall - a.rainfall)[0],
      worstAQI: [...data].sort((a, b) => b.aqi - a.aqi)[0]
    };
  }, [data]);

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

  const exportReport = () => {
    const headers = "City,State,Risk Level,Rainfall (mm),AQI,Temp,Timestamp\n";
    const rows = data.map(c => 
      `${c.name},${c.state},${c.riskLevel},${c.rainfall},${c.aqi},${c.temp},${lastUpdated.toISOString()}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GigShield_Risk_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="h-screen w-full bg-[#EEEEFF] flex flex-col overflow-hidden font-body">
      
      {/* Header */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-[#E8E6FF] bg-white z-[2000] shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-[#6C47FF] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#1A1A2E] tracking-tight">GigShield</span>
          </Link>
          <div className="h-6 w-[1px] bg-[#E8E6FF]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#6C47FF] tracking-widest uppercase flex items-center gap-2">
              🗺️ RISK HEAT INTELLIGENCE
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            </span>
            <span className="text-[9px] font-bold text-[#64748B] uppercase">LIVE ENGINE ACTIVE • SYNCING DATA</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6C47FF]" />
            <input 
              placeholder="Search city..." 
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
            <span className="text-[9px] font-bold text-[#64748B] uppercase">Last Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748B] hover:bg-[#F5F3FF] rounded-lg"><Home size={16} /></Button></Link>
            <Button onClick={() => auth.signOut().then(()=>router.push("/"))} variant="ghost" size="icon" className="h-8 w-8 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg"><LogOut size={16} /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex">
        
        {/* Full Screen Map */}
        <section className="flex-1 relative">
          <MapComponent data={filteredData} />

          {/* Compact Legend (Bottom Left) */}
          <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 backdrop-blur-md border border-[#E8E6FF] p-3 rounded-xl shadow-lg w-[180px]">
            <p className="text-[9px] font-black text-[#1A1A2E] uppercase tracking-widest mb-2 border-b border-[#E8E6FF] pb-1">Risk Legend</p>
            <div className="space-y-1.5">
              {[
                { label: 'Extreme (>50mm)', color: '#EF4444' },
                { label: 'High (>30mm)', color: '#F59E0B' },
                { label: 'Medium (>10mm)', color: '#EAB308' },
                { label: 'Low (>0mm)', color: '#22C55E' },
                { label: 'Safe (0mm)', color: '#64748B' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] font-bold text-[#64748B]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Bar (Bottom Center) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-[#E8E6FF] shadow-lg flex gap-1 items-center">
              {['ALL', 'EXTREME', 'HIGH', 'MEDIUM', 'LOW', 'SAFE'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setActiveFilter(r)} 
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${activeFilter === r ? 'bg-[#6C47FF] text-white shadow-md' : 'hover:bg-[#F5F3FF] text-[#64748B]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Dashboard (Right) */}
        <aside className="w-[280px] bg-white border-l border-[#E8E6FF] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 bg-[#6C47FF] text-white">
            <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Live Risk Dashboard
            </h2>
          </div>

          <div className="p-4 space-y-6">
            <section className="space-y-2">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Active Risk Zones</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Extreme', count: stats.extreme, color: 'text-[#EF4444]' },
                  { label: 'High', count: stats.high, color: 'text-[#F59E0B]' },
                  { label: 'Medium', count: stats.medium, color: 'text-[#EAB308]' },
                  { label: 'Safe', count: stats.safe, color: 'text-[#22C55E]' }
                ].map(item => (
                  <div key={item.label} className="bg-[#F8F9FF] p-2 rounded-lg border border-[#E8E6FF]">
                    <p className={`text-lg font-black ${item.color}`}>{item.count}</p>
                    <p className="text-[8px] font-bold text-[#64748B] uppercase">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Climate Extremes</p>
              <div className="space-y-2">
                <div className="bg-[#F8F9FF] p-3 rounded-xl border border-[#E8E6FF] space-y-1">
                  <p className="text-[8px] font-bold text-[#64748B] uppercase">🌧️ Highest Rainfall</p>
                  <p className="text-xs font-bold text-[#1A1A2E]">{stats.highestRain?.name}: {stats.highestRain?.rainfall}mm</p>
                </div>
                <div className="bg-[#F8F9FF] p-3 rounded-xl border border-[#E8E6FF] space-y-1">
                  <p className="text-[8px] font-bold text-[#64748B] uppercase">💨 Worst Air Quality</p>
                  <p className="text-xs font-bold text-[#1A1A2E]">{stats.worstAQI?.name}: AQI {stats.worstAQI?.aqi}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Action Center</p>
              <div className="space-y-2">
                <Button onClick={exportReport} className="w-full bg-[#F8F9FF] hover:bg-[#F5F3FF] border border-[#E8E6FF] text-[#6C47FF] font-bold text-[10px] h-9 shadow-none gap-2">
                  <FileDown className="h-3.5 w-3.5" /> EXPORT REPORT
                </Button>
                <Button className="w-full bg-[#EDE9FF] hover:bg-[#E0DAFF] border border-[#D4CCFF] text-[#6C47FF] font-bold text-[10px] h-9 shadow-none gap-2">
                  <Bell className="h-3.5 w-3.5" /> MANAGE ALERTS
                </Button>
              </div>
            </section>
          </div>

          <div className="mt-auto p-4 border-t border-[#E8E6FF]">
            <p className="text-[8px] font-bold text-[#94A3B8] text-center uppercase tracking-tighter">
              Operational Statistics Update Every 120s
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
