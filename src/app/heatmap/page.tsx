
"use client";

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Shield, ArrowLeft, Info, Search, Map as MapIcon, Loader2, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

export default function HeatmapPage() {
  const db = useFirestore();
  const [randomSeeds, setRandomSeeds] = useState<number[]>([]);
  
  const disruptionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "disruptionEvents"),
      orderBy("timestamp", "desc"),
      limit(10)
    );
  }, [db]);

  const { data: disruptions, isLoading } = useCollection(disruptionsQuery);

  useEffect(() => {
    // Generate stable random values on the client to avoid hydration mismatch
    setRandomSeeds(Array.from({ length: 20 }, () => Math.floor(Math.random() * 20 + 10)));
  }, []);

  // Fallback regions for visualization if no live events exist
  const staticRegions = [
    { id: 'north', name: 'Delhi NCR', status: 'Moderate', color: 'bg-warning', impact: '12% Loss', suggestion: 'Move to Noida Sec 62' },
    { id: 'west', name: 'Mumbai West', status: 'Critical', color: 'bg-danger', impact: '24% Loss', suggestion: 'Switch to Navi Mumbai' },
    { id: 'south', name: 'Bangalore East', status: 'Healthy', color: 'bg-success', impact: '0% Loss', suggestion: 'Peak Hours Starting' },
  ];

  const activeEvents = disruptions && disruptions.length > 0 ? disruptions : [];

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
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold text-heading">Live Disruptions<span className="text-primary text-sm ml-1 font-normal tracking-wider">BETA</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-success text-success bg-success-bg px-3 py-1 animate-pulse">
            LIVE ENGINE ACTIVE
          </Badge>
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <input placeholder="Search region..." className="bg-white border border-border rounded-btn pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48 transition-all" />
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex">
        {/* Map Representation */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-bg-page to-bg-page flex items-center justify-center p-4 lg:p-10">
          <div className="relative w-full max-w-2xl aspect-[3/4] bg-white rounded-card border border-border overflow-hidden shadow-card">
             {/* Map Grid */}
             <div className="absolute inset-0 grid grid-cols-8 grid-rows-10 opacity-10 pointer-events-none">
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-border" />
                ))}
             </div>
             
             {/* Dynamic Heat Spots from Firestore */}
             <TooltipProvider>
               {activeEvents.map((event, idx) => (
                 <Tooltip key={event.id}>
                   <TooltipTrigger asChild>
                     <motion.div 
                       initial={{ scale: 0, opacity: 0 }}
                       animate={{ scale: 1, opacity: 0.4 }}
                       className={`absolute cursor-pointer rounded-full bg-danger blur-3xl hover:opacity-80 transition-opacity`}
                       style={{ 
                         width: `${80 + (event.workersAffectedCount || 0) * 2}px`, 
                         height: `${80 + (event.workersAffectedCount || 0) * 2}px`,
                         top: `${20 + (idx * 15) % 60}%`,
                         left: `${20 + (idx * 25) % 70}%`
                       }}
                     />
                   </TooltipTrigger>
                   <TooltipContent className="bg-white border-border p-4 min-w-[240px] shadow-card">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold flex items-center gap-2 text-heading">
                            <AlertTriangle className="h-4 w-4 text-danger" />
                            Active Alert
                          </span>
                          <Badge className="bg-danger-bg text-danger border-transparent">CRITICAL</Badge>
                        </div>
                        <div className="text-sm space-y-2">
                          <p className="flex justify-between text-body"><span>Workers Affected:</span> <span className="font-bold text-heading">{event.workersAffectedCount}</span></p>
                          <p className="text-xs text-primary font-bold p-2 bg-primary-light rounded-btn border border-primary/20">
                            AI Suggestion: {event.aiSuggestion || "Redirect to nearest healthy zone immediately."}
                          </p>
                        </div>
                      </div>
                   </TooltipContent>
                 </Tooltip>
               ))}

               {/* Static Baseline Spots */}
               {staticRegions.map((region, idx) => (
                 <Tooltip key={region.id}>
                   <TooltipTrigger asChild>
                     <div 
                       className={`absolute cursor-pointer rounded-full ${region.color} blur-2xl opacity-20 hover:opacity-40 transition-opacity`}
                       style={{ 
                         width: '120px', 
                         height: '120px',
                         top: `${15 + idx * 25}%`,
                         left: `${15 + (idx % 2) * 50}%`
                       }}
                     />
                   </TooltipTrigger>
                   <TooltipContent className="bg-white border-border p-3">
                      <p className="font-bold text-sm text-heading">{region.name}</p>
                      <p className="text-xs text-body">{region.status} Activity</p>
                   </TooltipContent>
                 </Tooltip>
               ))}
             </TooltipProvider>

             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <MapIcon className="h-64 w-64 text-primary opacity-5" />
                <div className="absolute bottom-6 flex flex-col items-center gap-1">
                   <p className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">Live India Geospatial Feed v2.8</p>
                   <div className="h-1 w-32 bg-border rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="h-full w-full bg-primary/40"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Legend Sidebar */}
        <div className="w-96 border-l border-border bg-white p-6 hidden lg:flex flex-col overflow-hidden">
          <div className="mb-8">
            <h3 className="font-headline font-bold text-xl mb-2 flex items-center gap-2 text-heading">
              <TrendingUp className="h-5 w-5 text-primary" />
              Regional Analytics
            </h3>
            <p className="text-xs text-muted uppercase tracking-wider font-bold">Real-time Network Monitoring</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-bold text-heading">Syncing live events...</p>
              </div>
            ) : activeEvents.length > 0 ? (
              activeEvents.map((event, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={event.id} 
                  className="p-4 bg-bg-page rounded-card border border-border space-y-3 hover:border-primary transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                      <span className="font-bold text-sm text-heading">Zone {event.latitude.toFixed(2)}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-4 bg-danger-bg text-danger border-transparent">
                      -{randomSeeds[idx] || 15}% PAYOUT
                    </Badge>
                  </div>
                  <p className="text-xs text-body line-clamp-2 italic">
                    {event.aiSuggestion || "Significant disruption detected. Network stability is currently compromised in this sector."}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> ADVICE: SWITCH ZONE
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold text-primary hover:bg-primary-light">Details</Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-bg-page rounded-card border border-dashed border-border">
                <p className="text-sm text-heading font-bold">No critical disruptions found.</p>
                <p className="text-xs text-body mt-1">Earning environment is stable.</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-primary-light border border-primary/20 rounded-card relative overflow-hidden group shadow-card">
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-tight">AI Strategy Insight</span>
                </div>
                <p className="text-xs text-heading leading-relaxed font-bold">
                  Disruptions in Central areas typically last 120-180 mins. Move to peripheral IT corridors for 1.4x higher stability.
                </p>
             </div>
             <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform">
                <Shield className="h-24 w-24 text-primary" />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
