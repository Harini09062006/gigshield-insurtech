
"use client";

import React, { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  Zap, 
  ChevronRight
} from "lucide-react";

/**
 * Premium Income DNA Dashboard
 * Modern fintech UI with dynamic logic.
 */
export default function IncomeDNADashboard() {
  // Logic: Base Hourly Rate State
  const [baseRate, setBaseRate] = useState(60);

  // Time Slot Definitions with Specific UI Borders
  const timeSlots = useMemo(() => [
    { id: "morning", label: "Morning", hours: "6-10 AM", multiplier: 0.75, border: "border-b-[#f59e0b]" },
    { id: "afternoon", label: "Afternoon", hours: "12-4 PM", multiplier: 0.95, border: "border-b-[#3b82f6]" },
    { id: "evening", label: "Evening", hours: "5-9 PM", multiplier: 1.30, border: "border-b-[#6c47ff]" },
    { id: "night", label: "Night", hours: "9 PM-12 AM", multiplier: 0.85, border: "border-b-[#0ea5e9]" },
  ], []);

  // Calculate dynamic rates
  const slotData = useMemo(() => {
    return timeSlots.map(slot => ({
      ...slot,
      hourlyRate: Math.round(baseRate * slot.multiplier)
    }));
  }, [baseRate, timeSlots]);

  // Weekly Earnings Calculation (Formula: Slot Sum * 10hrs * 7days)
  const weeklyEarnings = useMemo(() => {
    const totalDayEarnings = slotData.reduce((sum, slot) => sum + (slot.hourlyRate * (slot.id === 'night' ? 3 : 4)), 0);
    return totalDayEarnings * 7;
  }, [slotData]);

  // Chart Data Generation (24-hour cycle)
  const chartData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, hour) => {
      let value = 20; 
      if (hour >= 6 && hour <= 10) value = baseRate * 0.75;
      if (hour >= 12 && hour <= 16) value = baseRate * 0.95;
      if (hour >= 17 && hour <= 21) value = baseRate * 1.35; 
      if (hour >= 22 || hour <= 2) value = baseRate * 0.85;
      
      // Soft variance for a natural premium feel
      value += (Math.sin(hour) * 3);
      
      return {
        time: `${hour}:00`,
        earnings: Math.round(Math.max(15, value))
      };
    });
  }, [baseRate]);

  const cardShadow = "shadow-[0_10px_30px_rgba(0,0,0,0.05)]";

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6 lg:p-10 font-body">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Controls */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
          <div>
            <h1 className="text-3xl font-headline font-bold text-[#1A1A2E]">Income DNA Profile</h1>
            <p className="text-[#64748B] text-sm font-medium mt-1">Real-time analysis of your earning patterns</p>
          </div>
          
          <div className={`bg-white px-6 py-3 rounded-[20px] flex items-center gap-4 ${cardShadow} border border-white`}>
            <div className="flex flex-col">
              <Label className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-widest mb-0.5">Base Earning Rate</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-[#1A1A2E]">₹</span>
                <input 
                  type="number" 
                  value={baseRate}
                  onChange={(e) => setBaseRate(Number(e.target.value))}
                  className="w-16 bg-transparent font-bold text-xl text-[#6c47ff] focus:outline-none"
                />
                <span className="text-[#94A3B8] text-sm font-bold">/ hr</span>
              </div>
            </div>
            <div className="h-10 w-px bg-[#f1f5f9]" />
            <TrendingUp size={24} className="text-[#6c47ff] opacity-50" />
          </div>
        </header>

        {/* Top Section: 4 Slot Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {slotData.map((slot) => (
            <Card key={slot.id} className={`border-none rounded-[20px] bg-white border-b-4 ${slot.border} ${cardShadow} transition-transform hover:-translate-y-1 duration-300`}>
              <CardContent className="p-6">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{slot.label} Profile</p>
                <p className="text-xs text-[#64748B] font-medium mb-4">{slot.hours}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#1A1A2E]">₹{slot.hourlyRate}</span>
                    <span className="text-[#94A3B8] text-sm font-bold ml-1">/hr</span>
                  </div>
                  <Badge variant="outline" className="border-[#f1f5f9] text-[#64748B] font-bold text-[10px]">
                    {slot.multiplier}x
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Main Section: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Weekly Earnings */}
          <section className="lg:col-span-4">
            <Card className={`h-full border-none rounded-[24px] bg-white overflow-hidden ${cardShadow}`}>
              <div className="bg-[#6c47ff] p-8 text-white relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Expected Weekly Earnings</p>
                <h3 className="text-5xl font-black mt-4">₹{weeklyEarnings.toLocaleString()}</h3>
                <div className="mt-6 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 w-fit">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Analysis Active</span>
                </div>
                <Zap className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
              </div>
              
              <CardContent className="p-8 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#f8faff] border border-[#f1f5f9] flex items-center justify-center text-[#6c47ff]">
                      <Badge variant="outline" className="border-none p-0"><span className="text-lg">🛡️</span></Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Current Protection</p>
                      <p className="text-lg font-black text-[#1A1A2E]">Pro Shield</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    Your income stability index is high. Maintain consistent shifts to maximize automated weather payouts.
                  </p>
                </div>

                <Button className="w-full h-14 rounded-2xl bg-[#6c47ff] hover:bg-[#5535e8] shadow-[0_8px_20px_rgba(108,71,255,0.2)] text-base font-bold flex items-center justify-center gap-2 group transition-all">
                  Upgrade My Plan <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Right Column: Intensity Chart */}
          <section className="lg:col-span-8">
            <Card className={`h-full border-none rounded-[24px] bg-white p-8 ${cardShadow}`}>
              <CardHeader className="p-0 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-headline font-bold text-[#1A1A2E]">Peak Earning Hours</CardTitle>
                    <CardDescription className="text-[#94A3B8] text-sm mt-1">24-hour profile based on DNA multipliers</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#f8faff] rounded-full border border-[#f1f5f9]">
                    <div className="h-2 w-2 rounded-full bg-[#6c47ff]" />
                    <span className="text-[10px] font-black text-[#1A1A2E] uppercase">Intensity High</span>
                  </div>
                </div>
              </CardHeader>
              
              <div className="h-[380px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c47ff" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                      interval={3}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#1A1A2E'
                      }} 
                      itemStyle={{ color: '#6c47ff' }}
                      cursor={{ stroke: '#6c47ff', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#6c47ff" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 pt-8 border-t border-[#f1f5f9] grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Stability", value: "92%", color: "text-[#22c55e]" },
                  { label: "Peak Shift", value: "5PM - 9PM", color: "text-[#1A1A2E]" },
                  { label: "DNA Index", value: "A+", color: "text-[#6c47ff]" },
                  { label: "Risk Capacity", value: "High", color: "text-[#22c55e]" }
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

        </div>
      </div>
    </div>
  );
}
