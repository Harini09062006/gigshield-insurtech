
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Dynamically import the MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-muted/10 rounded-card border border-dashed border-border gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-widest">Initializing Map Engine...</p>
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [searchQuery, setSearchQuery] = useState('');

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
          <Badge variant="outline" className="border-success text-success bg-success-bg px-3 py-1 font-bold animate-pulse">
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

      <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col gap-6">
        <div className="flex-1 w-full">
           <MapComponent searchQuery={searchQuery} />
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border bg-white text-center">
        <p className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">
          Powered by GigShield Real-time Disruption Analysis • © 2024
        </p>
      </footer>
    </div>
  );
}
