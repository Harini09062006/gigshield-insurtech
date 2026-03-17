
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, ArrowLeft, Search, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// Dynamically import the MapComponent to avoid SSR issues with Leaflet/Window
const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full bg-bg-page flex flex-col overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/worker/overview">
            <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary-light">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-headline font-bold text-heading">Live Disruptions<span className="text-primary text-sm ml-1 font-normal tracking-wider">ENGINE</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-success text-success bg-success-bg px-3 py-1 animate-pulse">
            LIVE ENGINE ACTIVE
          </Badge>
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <input 
              placeholder="Search region..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-border rounded-btn pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48 transition-all" 
            />
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex">
        {/* Real Map Component Container */}
        <div className="flex-1 bg-muted/10 p-4 lg:p-6">
          <div className="w-full h-full flex flex-col gap-4">
            <div className="flex-1 min-h-[500px] relative rounded-card shadow-card overflow-hidden">
              <MapComponent searchQuery={searchQuery} />
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-muted font-mono uppercase tracking-widest px-2">
              <span>Last Sync: {lastSync.toLocaleTimeString()}</span>
              <span>Regional Coverage: Mumbai, MH</span>
            </div>
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="w-96 border-l border-border bg-white p-6 hidden lg:flex flex-col overflow-hidden">
          <div className="mb-8">
            <h3 className="font-headline font-bold text-xl mb-2 flex items-center gap-2 text-heading">
              <TrendingUp className="h-5 w-5 text-primary" />
              Regional Strategy
            </h3>
            <p className="text-xs text-muted uppercase tracking-wider font-bold">Risk Prediction Model v4.1</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             <div className="p-4 bg-primary-light border border-primary/20 rounded-card space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Active Hazard</span>
                </div>
                <p className="text-xs text-heading font-bold">
                  Cluster detected in Kurla West. Predicted downtime: 90 mins. Divert to Chembur for 1.2x earnings.
                </p>
             </div>

             <div className="space-y-3 pt-4">
               <h4 className="text-xs font-bold text-muted uppercase tracking-widest">Stability Legend</h4>
               <div className="space-y-2">
                 <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-success" />
                     <span>High Stability</span>
                   </div>
                   <span className="text-muted">0-30% Risk</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-warning" />
                     <span>Moderate Risk</span>
                   </div>
                   <span className="text-muted">30-60% Risk</span>
                 </div>
                 <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-danger" />
                     <span>Extreme Disruption</span>
                   </div>
                   <span className="text-muted">80%+ Risk</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="mt-6 p-4 bg-bg-card-yellow border border-warning-bg rounded-card relative overflow-hidden group shadow-card">
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-tight">Earning Lock</span>
                </div>
                <p className="text-xs text-heading leading-relaxed font-bold">
                  Pro Shield active. Any disruption in marked "High Risk" zones triggers automatic payout eligibility.
                </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
