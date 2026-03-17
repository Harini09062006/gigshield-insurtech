
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, ArrowLeft, Search, Loader2, Home, FileText, Map as MapIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth, useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';

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
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-bg-page"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (!user) return null;

  return (
    <div className="h-screen w-full bg-bg-page flex flex-col overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-btn">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-headline font-bold text-heading">
              Gig<span className="text-primary">Shield</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className={pathname === "/dashboard" ? "text-primary bg-primary-light" : "text-body"}>
              <Home className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/claims">
            <Button variant="ghost" size="icon" className={pathname === "/claims" ? "text-primary bg-primary-light" : "text-body"}>
              <FileText className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/heatmap">
            <Button variant="ghost" size="icon" className={pathname === "/heatmap" ? "text-primary bg-primary-light" : "text-body"}>
              <MapIcon className="h-6 w-6" />
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-danger hover:bg-danger-bg">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-success text-success bg-success-bg px-3 py-1 font-bold animate-pulse">
              LIVE ENGINE ACTIVE
            </Badge>
            <h1 className="text-xl font-headline font-bold hidden sm:block">Real-time Disruption Analysis</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <input 
              placeholder="Search region..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-border rounded-btn pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48 transition-all" 
            />
          </div>
        </div>
        <div className="flex-1 w-full">
           <MapComponent searchQuery={searchQuery} />
        </div>
      </main>

      <footer className="px-6 py-2 border-t border-border bg-white text-center">
        <p className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">
          Powered by GigShield Real-time Disruption Analysis • © 2024
        </p>
      </footer>
    </div>
  );
}
