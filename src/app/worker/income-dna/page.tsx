
"use client";

import React, { useMemo } from "react";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import { 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon,
  Zap,
  LayoutDashboard
} from "lucide-react";

/**
 * PIXEL-PERFECT FINTECH CLONE: INCOME DNA PROFILE
 * Rules: Strict layout adherence, specific colors, no extra styling.
 */
export default function IncomeDNAPage() {
  const baseRate = 60;

  // 1. Logic for Time Cards
  const slotData = useMemo(() => [
    { id: "morning", title: "MORNING", range: "06:00 - 10:00", multiplier: 0.75, icon: Sunrise, borderColor: "border-b-[#fb923c]" },
    { id: "afternoon", title: "AFTERNOON", range: "12:00 - 16:00", multiplier: 0.95, icon: Sun, borderColor: "border-b-[#60a5fa]" },
    { id: "evening", title: "EVENING", range: "17:00 - 21:00", multiplier: 1.30, icon: Sunset, borderColor: "border-b-[#6d28d9]" },
    { id: "night", title: "NIGHT", range: "21:00 - 00:00", multiplier: 0.85, icon: Moon, borderColor: "border-b-[#93c5fd]" },
  ], []);

  // 2. Logic for Earnings
  // baseRate (60) * 8 hours/day * 7 days = 3360
  const weeklyEarnings = baseRate * 8 * 7;

  // 3. Chart Data: Smooth curves for Peak Earning Hours
  const chartData = [
    { hour: "00:00", value1: 30, value2: 20 },
    { hour: "04:00", value1: 25, value2: 15 },
    { hour: "08:00", value1: 55, value2: 40 }, // Morning Peak
    { hour: "12:00", value1: 65, value2: 50 }, // Lunch Peak
    { hour: "16:00", value1: 60, value2: 45 },
    { hour: "20:00", value1: 95, value2: 70 }, // Evening Peak
    { hour: "23:59", value1: 45, value2: 30 },
  ];

  return (
    <div className="min-h-screen bg-[#eef0f7] p-6 lg:p-10 font-body text-[#1A1A2E]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP SECTION: 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Hero Earnings Summary */}
          <Card className="border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-8 flex flex-col justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Expected Weekly Earnings</p>
              <h2 className="text-[52px] font-bold text-[#6d28d9] leading-tight">₹{weeklyEarnings.toLocaleString()}</h2>
              <p className="text-sm text-[#94A3B8] font-medium leading-relaxed">
                Calculated based on your historical work consistency and dynamic platform demand multipliers.
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-8 mt-4 border-t border-[#f1f5f9]">
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-1">Current Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  <p className="text-sm font-bold text-[#22c55e]">High Consistency</p>
                </div>
              </div>
              <Button variant="outline" className="border-[#6d28d9] text-[#6d28d9] rounded-xl font-bold px-6 h-11 hover:bg-[#6d28d9] hover:text-white transition-all shadow-none">
                View DNA Details
              </Button>
            </div>
          </Card>

          {/* Time Slot Grid (2x2) */}
          <div className="grid grid-cols-2 gap-6">
            {slotData.map((slot) => (
              <Card key={slot.id} className={`border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between border-b-[3px] ${slot.borderColor}`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-[#f8f9fc] flex items-center justify-center text-[#6d28d9]">
                      <slot.icon size={18} />
                    </div>
                    <span className="text-[9px] font-black text-[#94A3B8] tracking-widest">{slot.title}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#94A3B8] mb-0.5">{slot.range}</p>
                    <p className="text-xl font-bold">₹{Math.round(baseRate * slot.multiplier)}<span className="text-xs text-[#94A3B8] ml-1 font-medium">/hr</span></p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-[#6d28d9] uppercase tracking-tighter italic">
                    Demand Multiplier: {slot.multiplier}x
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* BELOW SECTION: 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Main Plan/Upgrade Card */}
          <Card className="border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-8 flex flex-col justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Plan Recommendation</p>
              <h3 className="text-3xl font-bold text-[#1A1A2E] leading-tight mt-2">Maximum Coverage</h3>
              <p className="text-sm text-[#94A3B8] font-medium mt-2">
                Your current earning velocity qualifies you for premium parametric protection.
              </p>
            </div>

            <div className="mt-8 p-5 bg-[#f8f9fc] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Recommended Plan</p>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#f59e0b] fill-[#f59e0b]" />
                  <span className="text-sm font-bold text-[#f59e0b]">Pro Shield</span>
                </div>
              </div>
              <Button className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-xl font-bold px-6 h-11 transition-all shadow-none">
                Upgrade Plan
              </Button>
            </div>
          </Card>

          {/* Peak Earning Hours Chart */}
          <Card className="border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">Peak Earning Hours (24-Hour Profile)</h3>
              <div className="px-3 py-1 bg-[#f8f9fc] rounded-full text-[9px] font-black text-[#6d28d9] tracking-wider uppercase flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#6d28d9]" /> Live Intel
              </div>
            </div>
            
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPurp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value1" 
                    stroke="#6d28d9" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPurp)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value2" 
                    stroke="#fb923c" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1} 
                    fill="url(#colorOrg)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#6d28d9]" />
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Evening Peak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#fb923c]" />
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Lunch Peak</span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
