"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Shield, Search, Loader2, Home, LogOut, X, 
  Zap, BarChart3, CloudRain, Wind, Cloud, Map as MapIcon,
  AlertCircle, Download, Bell, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-[#F5F3FF] rounded-2xl border-2 border-dashed border-[#E8E6FF] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#6C47FF]" />
        <p className="text-sm font-black text-[#6C47FF] uppercase tracking-widest animate-pulse">
          Initializing Global Risk Engine...
        </p>
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dataType, setDataType] = useState('rain');
  const [activeLayer, setActiveLayer] = useState('base');
  const [lastUpdated, setLastUpdated] = useState('Just now');
  
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  if (isUserLoading || !mounted) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;

  return (
    <div className="h-screen w-full bg-[#EEEEFF] flex flex-col overflow-hidden font-body">
      
      {/* Header */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-[0_4px_20px_rgba(108,71,255,0.05)]">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(108,71,255,0.3)]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-headline font-bold text-[#1A1A2E] leading-none">
                GigShield <span className="text-[#6C47FF]">OPS</span>
              </span>
              <span className="text-[10px] font-bold text-[#64748B] tracking-[0.2em] uppercase mt-1">Operations Center</span>
            </div>
          </Link>
          <div className="h-8 w-[1px] bg-[#E8E6FF] hidden md:block" />
          <div className="hidden lg:flex items-center gap-3">
            <Badge className="bg-[#DCFCE7] text-[#22C55E] border-none px-3 py-1 font-bold animate-pulse text-[10px] flex gap-2 items-center">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              LIVE ENGINE ACTIVE
            </Badge>
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">
              Syncing global disruption data...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-80 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C47FF]" />
            <input 
              placeholder="Search city or district..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FF] border-2 border-[#E8E6FF] rounded-xl pl-10 pr-10 py-2 text-sm focus:outline-none focus:border-[#6C47FF] transition-all" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EF4444]"><X className="h-4 w-4" /></button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B] hover:bg-[#F5F3FF]"><Home /></Button></Link>
            <Button onClick={handleLogout} variant="ghost" size="icon" className="text-[#EF4444] hover:bg-[#FEE2E2]"><LogOut /></Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Stats Sidebar */}
        <aside className="w-80 bg-white border-r border-[#E8E6FF] overflow-y-auto p-6 flex flex-col gap-6 hidden xl:flex">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#1A1A2E] uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#6C47FF]" />
              Risk Dashboard
            </h2>
            <button className="text-[#6C47FF] hover:rotate-180 transition-transform duration-500">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-[#E8E6FF] bg-[#F8F9FF]">
              <p className="text-[9px] font-bold text-[#EF4444] uppercase mb-1">Extreme</p>
              <p className="text-2xl font-bold text-[#1A1A2E]">02</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E8E6FF] bg-[#F8F9FF]">
              <p className="text-[9px] font-bold text-[#F59E0B] uppercase mb-1">High Risk</p>
              <p className="text-2xl font-bold text-[#1A1A2E]">04</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E8E6FF] bg-[#F8F9FF]">
              <p className="text-[9px] font-bold text-[#EAB308] uppercase mb-1">Medium</p>
              <p className="text-2xl font-bold text-[#1A1A2E]">03</p>
            </div>
            <div className="p-4 rounded-xl border border-[#E8E6FF] bg-[#F8F9FF]">
              <p className="text-[9px] font-bold text-[#22C55E] uppercase mb-1">Safe</p>
              <p className="text-2xl font-bold text-[#1A1A2E]">06</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#E8E6FF] pt-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#64748B]">Total Workers</span>
              <span className="text-sm font-bold text-[#1A1A2E]">1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#64748B]">Exposure At Risk</span>
              <span className="text-sm font-bold text-[#EF4444]">234</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#64748B]">Claims Processed</span>
              <span className="text-sm font-bold text-[#6C47FF]">23</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#64748B]">Daily Payouts</span>
              <span className="text-sm font-bold text-[#22C55E]">₹55,680</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F3FF] border border-[#D4CCFF] space-y-3 mt-auto">
            <p className="text-[10px] font-black text-[#6C47FF] uppercase">Highest Impact City</p>
            <div>
              <p className="text-sm font-bold text-[#1A1A2E]">Chennai, TN</p>
              <p className="text-xs text-[#64748B]">65mm Rainfall detected</p>
            </div>
            <div className="h-1 w-full bg-white rounded-full overflow-hidden">
              <div className="h-full w-4/5 bg-[#6C47FF]" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-[#6C47FF] text-white text-[10px] font-bold h-9 gap-2"><Download className="h-3 w-3" /> EXPORT</Button>
            <Button variant="outline" className="flex-1 border-[#6C47FF] text-[#6C47FF] text-[10px] font-bold h-9 gap-2"><Bell className="h-3 w-3" /> ALERTS</Button>
          </div>
        </aside>

        {/* Map Container */}
        <section className="flex-1 flex flex-col relative">
          
          {/* Top Controls Overlay */}
          <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-4">
            {/* Risk Filters */}
            <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl border border-[#E8E6FF] shadow-xl flex gap-1">
              {['all', 'extreme', 'high', 'medium', 'low', 'safe'].map(risk => (
                <button 
                  key={risk}
                  onClick={() => setRiskFilter(risk)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    riskFilter === risk ? 'bg-[#6C47FF] text-white' : 'hover:bg-[#F5F3FF] text-[#64748B]'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>

            {/* Layer Toggles */}
            <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl border border-[#E8E6FF] shadow-xl flex gap-1 w-fit">
              {[
                {id: 'base', icon: MapIcon, label: 'Base'},
                {id: 'rain', icon: CloudRain, label: 'Rain'},
                {id: 'wind', icon: Wind, label: 'Wind'},
                {id: 'clouds', icon: Cloud, label: 'Clouds'}
              ].map(layer => (
                <button 
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase transition-all ${
                    activeLayer === layer.id ? 'bg-[#6C47FF] text-white' : 'hover:bg-[#F5F3FF] text-[#64748B]'
                  }`}
                >
                  <layer.icon className="h-3 w-3" />
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extreme Alert Banner */}
          <AnimatePresence>
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-6 right-6 z-[1000] max-w-sm"
            >
              <div className="bg-white border-l-4 border-[#EF4444] rounded-xl shadow-2xl p-4 flex gap-4 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FEE2E2] opacity-50 rounded-full -mr-12 -mt-12" />
                <div className="h-10 w-10 bg-[#FEE2E2] rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="text-[#EF4444] h-6 w-6" />
                </div>
                <div className="space-y-2 relative z-10">
                  <p className="text-xs font-black text-[#EF4444] uppercase tracking-widest">Extreme Weather Alert</p>
                  <p className="text-[13px] font-bold text-[#1A1A2E]">Chennai: 67mm rainfall detected! 89 workers at risk.</p>
                  <div className="flex gap-2 pt-1">
                    <Button className="bg-[#6C47FF] text-white text-[10px] font-bold h-7 px-3">TRIGGER CLAIMS</Button>
                    <Button variant="ghost" className="text-[#64748B] text-[10px] font-bold h-7 px-3">DISMISS</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <MapComponent 
            searchQuery={searchQuery} 
            riskFilter={riskFilter} 
            dataType={dataType}
            activeLayer={activeLayer}
          />
        </section>
      </main>
    </div>
  );
}
