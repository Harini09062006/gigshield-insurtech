
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, Search, X, ArrowLeft, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const [data, setData] = useState<CityRiskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CityRiskData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityRiskData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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

  // Search Logic
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = data.filter(c => 
      c.name.toLowerCase().includes(val.toLowerCase()) || 
      c.state.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const selectCity = (city: CityRiskData) => {
    setSearchQuery(city.name);
    setSuggestions([]);
    setSelectedCity(city);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setSelectedCity(null);
  };

  const minsAgo = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000);

  return (
    <div className="h-screen w-full bg-[#EEEEFF] relative overflow-hidden font-body">
      
      {/* HEADER COMMAND BAR */}
      <header className="absolute top-0 left-0 right-0 z-[2000] bg-white/95 backdrop-blur-md border-b border-[#E8E6FF] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#6C47FF] rounded-lg flex items-center justify-center shadow-btn">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black text-[#1A1A2E] tracking-tight">GigShield</span>
        </div>

        <div className="hidden md:flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#6C47FF] tracking-[0.2em] uppercase">Risk Heat Intelligence</span>
            <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
          </div>
          <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest mt-0.5">Live Engine Active • Syncing Disruption Data</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input 
                type="text"
                placeholder="Search city..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#F8F9FF] border border-[#E8E6FF] rounded-full py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#6C47FF] focus:ring-2 focus:ring-[#6C47FF]/10 transition-all"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3 w-3 text-[#64748B] hover:text-[#1A1A2E]" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8E6FF] rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-[3000]">
                {suggestions.map(city => (
                  <button 
                    key={city.name}
                    onClick={() => selectCity(city)}
                    className="w-full text-left px-4 py-3 hover:bg-[#F5F3FF] border-b border-[#F5F3FF] last:border-none transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#1A1A2E]">{city.name}</p>
                      <p className="text-[9px] text-[#64748B] uppercase font-bold">{city.state}</p>
                    </div>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: city.riskColor }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* NAVIGATION CONTROLS - FIXED CONSISTENCY */}
          <div className="flex items-center gap-2 border-l border-[#E8E6FF] pl-3 ml-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/dashboard')}
              className="h-9 w-9 bg-[#f0f2f9] text-[#6C47FF] rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Go to Dashboard"
            >
              <Home className="h-4.5 w-4.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="h-9 w-9 bg-white border border-[#E8E6FF] text-[#64748B] hover:text-[#6C47FF] rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Go Back"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </div>
          
          <div className="hidden lg:flex flex-col items-end border-l border-[#E8E6FF] pl-3 ml-1">
            <p className="text-[9px] font-black text-[#64748B] uppercase tracking-tighter">Sync State</p>
            <p className="text-[10px] font-bold text-[#1A1A2E]">{minsAgo === 0 ? 'Fresh' : `${minsAgo}m ago`} 🔄</p>
          </div>
        </div>
      </header>
      
      {/* Full Width Map Main View */}
      <main className="w-full h-full">
        <MapComponent data={data} searchResult={selectedCity} />
      </main>

      {/* Small Compact Legend (Bottom Left) */}
      <div className="absolute bottom-10 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-card border border-[#E8E6FF] w-[180px]">
        <p className="text-[10px] font-black text-[#1A1A2E] uppercase tracking-widest mb-3 border-b border-[#E8E6FF] pb-1">Disruption Legend</p>
        <div className="space-y-2">
          {[
            { label: 'Extreme (>50mm)', color: '#EF4444' },
            { label: 'High (30-50mm)', color: '#F59E0B' },
            { label: 'Medium (10-30mm)', color: '#EAB308' },
            { label: 'Low (1-10mm)', color: '#22C55E' },
            { label: 'Safe (0mm)', color: '#64748B' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-bold text-[#64748B]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Status Overlay */}
      {isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border border-[#E8E6FF] flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-[#6C47FF]" />
          <span className="text-[10px] font-black text-[#6C47FF] tracking-widest uppercase">Updating Risk Matrix...</span>
        </div>
      )}
    </div>
  );
}
