
"use client";

import React, { useMemo } from "react";
import { 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon, 
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * PIXEL-PERFECT INCOME DNA CLONE
 * Matches reference design exactly: lavender background, white cards, dual chart.
 */
export default function IncomeDNAProfile() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // Constants matching the DNA Model
  const slots = [
    { title: "MORNING", range: "6-10 AM", rate: 45, mult: "0.75x multiplier", color: "#F59E0B", icon: Sunrise },
    { title: "AFTERNOON", range: "12-4 PM", rate: 57, mult: "0.95x multiplier", color: "#3B82F6", icon: Sun },
    { title: "EVENING", range: "5-9 PM", rate: 78, mult: "1.30x multiplier", color: "#6C47FF", icon: Sunset },
    { title: "NIGHT", range: "9 PM-12 AM", rate: 51, mult: "0.85x multiplier", color: "#60A5FA", icon: Moon },
  ];

  // Dual-series data for the chart peaks
  const chartData = [
    { time: '6 AM', evening: 10, lunch: 5, active: 20 },
    { time: '8 AM', evening: 15, lunch: 10, active: 35 },
    { time: '10 AM', evening: 20, lunch: 25, active: 45 },
    { time: '12 PM', evening: 30, lunch: 75, active: 55 },
    { time: '2 PM', evening: 35, lunch: 60, active: 50 },
    { time: '4 PM', evening: 50, lunch: 30, active: 60 },
    { time: '6 PM', evening: 95, lunch: 15, active: 85 },
    { time: '8 PM', evening: 85, lunch: 10, active: 75 },
    { time: '10 PM', evening: 40, lunch: 5, active: 45 },
    { time: '11 PM', evening: 25, lunch: 0, active: 30 },
  ];

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#eef0f7] p-10 flex items-center justify-center">
        <Activity className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef0f7] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* TOP SECTION: DNA CARDS */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Income DNA Profile</h1>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Updated 17:25</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {slots.map((slot, i) => (
              <Card key={i} className="bg-white border-none rounded-[20px] shadow-sm p-6 relative overflow-hidden flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-50 rounded-lg">
                    <slot.icon size={14} className="text-gray-400" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider">{slot.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">{slot.range}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1A1A2E]">₹{slot.rate}</span>
                    <span className="text-sm font-bold text-[#1A1A2E]">/hr</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-[#6C47FF]/60">{slot.mult}</p>
                {/* Thin colored bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slot.color }} />
              </Card>
            ))}
          </div>
        </div>

        {/* MAIN SECTION: 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: EXPECTED EARNINGS */}
          <Card className="bg-white border-none rounded-[20px] shadow-sm p-10 flex flex-col justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">EXPECTED WEEKLY EARNINGS</p>
              <div className="text-7xl font-bold text-[#6C47FF]">₹3360</div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mt-4">
                Derived from your Income DNA earning pattern across 40 projected working hours.
              </p>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter mb-1">RECOMMENDED PLAN</p>
                <p className="text-xl font-bold text-[#F59E0B]">Pro Shield</p>
              </div>
              <Button variant="outline" className="border-2 border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#6C47FF] hover:text-white rounded-xl px-8 h-12 transition-all text-sm">
                Upgrade Plan
              </Button>
            </div>
          </Card>

          {/* RIGHT: PEAK EARNING HOURS CHART */}
          <Card className="bg-white border-none rounded-[20px] shadow-sm p-8">
            <h3 className="text-sm font-bold text-[#1A1A2E] mb-10">Peak Earning Hours (24-Hour Profile)</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLunch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="evening" 
                    stroke="#6C47FF" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorEvening)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lunch" 
                    stroke="#F59E0B" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorLunch)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stroke="#E8E6FF" 
                    strokeWidth={1} 
                    fill="none"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* LEGEND MATCHING REFERENCE */}
            <div className="mt-8 flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#6C47FF]" />
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Evening peak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Lunch peak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-3 rounded-full border-t border-dashed border-[#94A3B8]" />
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Active hours</span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
