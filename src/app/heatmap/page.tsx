"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Shield, Search, Loader2, Home, LogOut, X, 
  Zap, BarChart3, CloudRain, Wind, Cloud, Map as MapIcon,
  AlertCircle, Download, Bell, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { CityRiskData } from '@/services/weatherService';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import map to prevent SSR issues with Leaflet
const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F3FF] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#6C47FF]" />
        <p className="text-sm font-bold text-[#6C47FF] uppercase tracking-widest animate-pulse">Initializing Risk Engine...</p>
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [activeLayer, setActiveLayer] = useState('base');
  const [cityData, setCityData] = useState<CityRiskData[]>([]);
  const [flyTo, setFlyTo] = useState<{lat:number, lng:number} | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [alerts, setAlerts] = useState<CityRiskData[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  // Role verification to prevent permission errors
  useEffect(() => {
    async function checkRole() {
      if (user && db) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
          }
        } catch (e) {
          console.error("Role check failed", e);
        } finally {
          setCheckingAdmin(false);
        }
      } else if (!user) {
        setCheckingAdmin(false);
      }
    }
    checkRole();
  }, [user, db]);

  // Gated Firebase Data - Only fires if confirmed as admin
  const usersQuery = useMemoFirebase(() => (db && isAdmin) ? collection(db, "users") : null, [db, isAdmin]);
  const claimsQuery = useMemoFirebase(() => (db && isAdmin) ? collection(db, "claims") : null, [db, isAdmin]);
  
  const { data: users } = useCollection(usersQuery);
  const { data: claims } = useCollection(claimsQuery);

  useEffect(() => {
    const extremeCities = cityData.filter(c => c.rainfall > 50);
    setAlerts(extremeCities);
  }, [cityData]);

  const handleTriggerAlert = async (cityName: string) => {
    if (!db || !isAdmin) {
      alert("Permission denied: Admin role required to trigger mass payouts.");
      return;
    }
    const city = cityData.find(c => c.name === cityName);
    try {
      await addDoc(collection(db, 'claims'), {
        trigger_type: 'admin_weather_alert',
        city: cityName,
        rainfall: city?.rainfall || 0,
        status: 'triggered',
        created_at: serverTimestamp()
      });
      alert(`Mass payout triggered for ${cityName}!`);
    } catch (e) {
      alert("Error triggering alert. Check console for details.");
    }
  };

  useEffect(() => {
    // Make alert trigger available to Leaflet popup
    (window as any).triggerAlert = handleTriggerAlert;
  }, [cityData, isAdmin]);

  const exportReport = () => {
    const headers = "City,Risk,Rainfall(mm),AQI,Temp(C),Timestamp\n";
    const rows = cityData.map(c => `${c.name},${c.riskLevel},${c.rainfall},${c.aqi},${c.temp},${lastUpdated.toISOString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GigShield_Risk_Report_${lastUpdated.toLocaleDateString()}.csv`;
    a.click();
  };

  const stats = useMemo(() => ({
    extreme: cityData.filter(c => c.riskLevel === 'EXTREME').length,
    high: cityData.filter(c => c.riskLevel === 'HIGH').length,
    medium: cityData.filter(c => c.riskLevel === 'MEDIUM').length,
    safe: cityData.filter(c => c.riskLevel === 'SAFE').length,
    highestRain: [...cityData].sort((a,b) => b.rainfall - a.rainfall)[0],
    worstAQI: [...cityData].sort((a,b) => b.aqi - a.aqi)[0],
    hottest: [...cityData].sort((a,b) => b.temp - a.temp)[0],
    payouts: claims?.reduce((acc, c) => acc + (c.compensation || 0), 0) || 0
  }), [cityData, claims]);

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
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#6C47FF]">🗺️ RISK HEAT INTELLIGENCE</span>
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] font-bold text-[#22C55E]">LIVE ENGINE ACTIVE</span>
            </div>
            <span className="text-[10px] text-[#64748B]">Syncing disruption data...</span>
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
            {searchQuery && (
              <div className="absolute top-full left-0 w-full bg-white border border-[#E8E6FF] rounded-b-lg shadow-xl mt-1 max-h-40 overflow-y-auto z-[60]">
                {cityData.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                  <div key={c.name} onClick={() => { setFlyTo({lat:c.lat, lng:c.lng}); setSearchQuery(''); }} className="p-2 text-xs hover:bg-[#F5F3FF] cursor-pointer">📍 {c.name} ({c.riskLevel})</div>
                ))}
              </div>
            )}
          </div>
          <span className="text-[10px] text-[#64748B] hidden md:inline">Last updated: {Math.floor((new Date().getTime() - lastUpdated.getTime())/60000)} mins ago 🔄</span>
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B] hover:bg-[#F5F3FF]"><Home /></Button></Link>
          <Button onClick={() => auth.signOut().then(()=>router.push("/"))} variant="ghost" size="icon" className="text-[#EF4444] hover:bg-[#FEE2E2]"><LogOut /></Button>
        </div>
      </header>

      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Map Section */}
        <section className="flex-1 relative h-full">
          
          {/* Alerts Banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 w-full max-w-lg px-4">
            <AnimatePresence>
              {alerts.map(city => (
                <motion.div key={city.name} initial={{y:-50, opacity:0}} animate={{y:0, opacity:1}} exit={{opacity:0}} className="bg-[#FEE2E2] border-l-4 border-[#EF4444] p-4 rounded-lg shadow-xl flex items-start gap-4">
                  <AlertCircle className="text-[#EF4444] h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#EF4444]">⚠️ EXTREME WEATHER ALERT!</p>
                    <p className="text-[11px] text-[#1A1A2E]">{city.name}: {city.rainfall}mm rainfall detected! 89 workers at risk! Claims auto-triggering...</p>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => handleTriggerAlert(city.name)} className="bg-[#6C47FF] text-white text-[10px] h-7 px-3">Trigger Mass Payout</Button>
                      <Button variant="ghost" onClick={() => setAlerts(p => p.filter(a => a.name !== city.name))} className="text-[#64748B] text-[10px] h-7 px-3">Dismiss</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <MapComponent 
            searchQuery={searchQuery} 
            riskFilter={riskFilter} 
            dataType="rain"
            activeLayer={activeLayer}
            onDataLoaded={(d) => { setCityData(d); setLastUpdated(new Date()); }}
            flyToCity={flyTo}
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
                <button key={r} onClick={() => setRiskFilter(r)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${riskFilter === r ? 'bg-[#6C47FF] text-white' : 'hover:bg-[#F5F3FF] text-[#64748B]'}`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-6 right-[300px] z-[1000] bg-white/90 backdrop-blur-md p-2 rounded-xl border border-[#E8E6FF] shadow-2xl hidden md:flex gap-1">
            {[
              {id: 'base', icon: MapIcon, label: 'Base'},
              {id: 'rain', icon: CloudRain, label: 'Rain'},
              {id: 'wind', icon: Wind, label: 'Wind'},
              {id: 'clouds', icon: Cloud, label: 'Clouds'}
            ].map(l => (
              <button key={l.id} onClick={() => setActiveLayer(l.id)} className={`p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase transition-all ${activeLayer === l.id ? 'bg-[#6C47FF] text-white' : 'hover:bg-[#F5F3FF] text-[#64748B]'}`}>
                <l.icon className="h-3 w-3" /> {l.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sidebar Dashboard */}
        <aside className="w-[280px] bg-white border-l border-[#E8E6FF] overflow-y-auto hidden lg:flex flex-col">
          <div className="p-6 bg-[#6C47FF] text-white">
            <h2 className="text-sm font-black tracking-widest flex items-center gap-2"><BarChart3 className="h-4 w-4" /> LIVE RISK DASHBOARD</h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#F8F9FF] border border-[#E8E6FF] rounded-lg">
                <p className="text-[9px] font-bold text-[#EF4444] uppercase mb-1">🔴 Extreme</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{stats.extreme}</p>
              </div>
              <div className="p-3 bg-[#F8F9FF] border border-[#E8E6FF] rounded-lg">
                <p className="text-[9px] font-bold text-[#F59E0B] uppercase mb-1">🟠 High Risk</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{stats.high}</p>
              </div>
              <div className="p-3 bg-[#F8F9FF] border border-[#E8E6FF] rounded-lg">
                <p className="text-[9px] font-bold text-[#EAB308] uppercase mb-1">🟡 Medium</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{stats.medium}</p>
              </div>
              <div className="p-3 bg-[#F8F9FF] border border-[#E8E6FF] rounded-lg">
                <p className="text-[9px] font-bold text-[#22C55E] uppercase mb-1">🟢 Safe</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{stats.safe}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-[#E8E6FF] pt-6">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#64748B]">👷 Total Workers</span>
                <span className="text-[#1A1A2E]">{users ? users.length : "Admin Only"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#64748B]">⚠️ At Risk</span>
                <span className="text-[#EF4444]">{stats.extreme * 45 + stats.high * 22}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#64748B]">✅ Protected</span>
                <span className="text-[#22C55E]">{users ? Math.round(users.length * 0.8) : "Admin Only"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#64748B]">💰 Claims Today</span>
                <span className="text-[#6C47FF]">{claims ? claims.length : "Admin Only"}</span>
              </div>
            </div>

            <div className="space-y-4 border-t border-[#E8E6FF] pt-6">
              <p className="text-[10px] font-black text-[#6C47FF] uppercase">Weather Extremes</p>
              <div className="space-y-2">
                <div className="text-[11px]"><span className="text-[#64748B]">🌧️ Highest Rain:</span> <b className="text-[#1A1A2E]">{stats.highestRain?.name || "--"} — {stats.highestRain?.rainfall || 0}mm</b></div>
                <div className="text-[11px]"><span className="text-[#64748B]">💨 Worst AQI:</span> <b className="text-[#1A1A2E]">{stats.worstAQI?.name || "--"} — Level {stats.worstAQI?.aqi || 0}</b></div>
                <div className="text-[11px]"><span className="text-[#64748B]">🌡️ Hottest:</span> <b className="text-[#1A1A2E]">{stats.hottest?.name || "--"} — {stats.hottest?.temp || 0}°C</b></div>
              </div>
            </div>

            <div className="p-4 bg-[#EDE9FF] border border-[#D4CCFF] rounded-xl mt-auto">
              <p className="text-[10px] font-bold text-[#6C47FF] uppercase mb-1">💰 Financial Impact</p>
              <p className="text-xl font-bold text-[#1A1A2E]">₹{isAdmin ? stats.payouts.toLocaleString() : "--"}</p>
              <p className="text-[10px] text-[#64748B] mt-1">{isAdmin ? "Daily Payouts Today" : "Admin Visibility Locked"}</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={exportReport} className="flex-1 bg-[#6C47FF] text-white text-[10px] font-bold h-9 gap-2"><Download className="h-3 w-3" /> EXPORT</Button>
              <Button variant="outline" className="flex-1 border-[#6C47FF] text-[#6C47FF] text-[10px] font-bold h-9 gap-2"><Bell className="h-3 w-3" /> ALERTS</Button>
            </div>
          </div>
          <div className="p-4 bg-[#F8F9FF] border-t border-[#E8E6FF] text-center">
            <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-widest">Statistics update every 2 minutes</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
