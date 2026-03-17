
"use client";

import { Shield, ArrowLeft, Info, Search, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function HeatmapPage() {
  const regions = [
    { id: 'north', name: 'North India', status: 'Moderate', color: 'bg-yellow-500', impact: '12% Loss', suggestion: 'Stay in Noida' },
    { id: 'west', name: 'West India', status: 'Critical', color: 'bg-red-500', impact: '24% Loss', suggestion: 'Move to Navi Mumbai' },
    { id: 'south', name: 'South India', status: 'Healthy', color: 'bg-green-500', impact: '0% Loss', suggestion: 'Normal Operations' },
    { id: 'east', name: 'East India', status: 'Healthy', color: 'bg-green-500', impact: '0% Loss', suggestion: 'Normal Operations' },
  ];

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold">Live Heatmap</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-green-500 text-green-500">System Healthy</Badge>
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search region..." className="bg-muted/50 border-border/50 rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-48" />
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex">
        {/* Simplified Map Representation */}
        <div className="flex-1 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-card/50 to-background flex items-center justify-center p-10">
          <div className="relative w-full max-w-2xl aspect-[3/4] bg-muted/10 rounded-3xl border border-border/30 overflow-hidden">
             {/* Abstract Map UI */}
             <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-border/30" />
                ))}
             </div>
             
             {/* Heat Spots */}
             <TooltipProvider>
               {regions.map((region, idx) => (
                 <Tooltip key={region.id}>
                   <TooltipTrigger asChild>
                     <div 
                       className={`absolute cursor-pointer animate-pulse rounded-full ${region.color} blur-2xl opacity-40 hover:opacity-70 transition-opacity`}
                       style={{ 
                         width: '180px', 
                         height: '180px',
                         top: `${15 + idx * 20}%`,
                         left: `${20 + (idx % 2) * 30}%`
                       }}
                     />
                   </TooltipTrigger>
                   <TooltipContent className="bg-card border-border/50 p-4 min-w-[200px]">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{region.name}</span>
                          <Badge className={`${region.color} text-white`}>{region.status}</Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="flex justify-between"><span>Impact:</span> <span className="font-bold">{region.impact}</span></p>
                          <p className="flex justify-between"><span>Suggestion:</span> <span className="font-bold text-primary">{region.suggestion}</span></p>
                        </div>
                      </div>
                   </TooltipContent>
                 </Tooltip>
               ))}
             </TooltipProvider>

             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <MapIcon className="h-64 w-64 text-foreground/5 opacity-40" />
                <p className="absolute bottom-10 text-xs text-muted-foreground font-mono">LIVE INDIA GEOSPATIAL FEED v2.4</p>
             </div>
          </div>
        </div>

        {/* Legend Sidebar */}
        <div className="w-80 border-l border-border/50 bg-card/30 p-6 hidden lg:block overflow-y-auto">
          <h3 className="font-headline font-bold mb-6 text-lg">Region Insights</h3>
          <div className="space-y-6">
            {regions.map((region) => (
              <div key={region.id} className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${region.color}`} />
                  <span className="font-bold">{region.name}</span>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Status: <span className="text-foreground font-medium">{region.status}</span></p>
                  <p className="text-muted-foreground">Earning Impact: <span className="text-destructive font-medium">{region.impact}</span></p>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-primary font-bold">{region.suggestion}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 bg-primary/10 border border-primary/20 rounded-xl">
             <div className="flex items-center gap-2 text-primary mb-2">
               <Info className="h-4 w-4" />
               <span className="text-xs font-bold uppercase">Pro Tip</span>
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed">
               Collective disruptions are being detected in Mumbai Central. Workers are moving to Bandra for 1.5x earnings.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
