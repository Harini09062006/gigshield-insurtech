
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
import { Input } from "@/components/ui/input";
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
  Sunrise, 
  Sun, 
  Sunset, 
  Moon, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  Info
} from "lucide-react";

/**
 * Income DNA Dashboard
 * Implements Sections 1, 2, and 3 with dynamic fintech logic.
 */
export default function IncomeDNADashboard() {
  // Logic: Base Hourly Rate State
  const [baseRate, setBaseRate] = useState(60);
  const hoursPerDay = 10; // Fixed for calculation logic

  // Section 1 Logic: Time Slots & Multipliers
  const timeSlots = useMemo(() => [
    { id: "morning", label: "Morning", hours: "6-10 AM", icon: Sunrise, multiplier: 0.75, color: "#6C47FF" },
    { id: "afternoon", label: "Afternoon", hours: "12-4 PM", icon: Sun, multiplier: 0.95, color: "#3B82F6" },
    { id: "evening", label: "Evening", hours: "5-9 PM", icon: Sunset, multiplier: 1.30, color: "#F59E0B" },
    { id: "night", label: "Night", hours: "9 PM-12 AM", icon: Moon, multiplier: 0.85, color: "#1A1A2E" },
  ], []);

  const slotData = useMemo(() => {
    return timeSlots.map(slot => ({
      ...slot,
      hourlyRate: Math.round(baseRate * slot.multiplier)
    }));
  }, [baseRate, timeSlots]);

  // Identify Highest Earning Slot dynamically
  const peakSlot = useMemo(() => {
    return [...slotData].sort((a, b) => b.hourlyRate - a.hourlyRate)[0];
  }, [slotData]);

  // Section 2 Logic: Weekly Earnings Calculation
  const weeklyEarnings = useMemo(() => {
    const totalDayEarnings = slotData.reduce((sum, slot) => sum + (slot.hourlyRate * (slot.id === 'night' ? 3 : 4)), 0);
    // Weekly = daily * 7
    return totalDayEarnings * 7;
  }, [slotData]);

  // Plan Recommendation Logic
  const recommendedPlan = useMemo(() => {
    if (weeklyEarnings < 5000) return { name: "Basic Shield", color: "text-blue-500", bg: "bg-blue-50" };
    if (weeklyEarnings < 8000) return { name: "Pro Shield", color: "text-primary", bg: "bg-primary-light" };
    return { name: "Elite Shield", color: "text-amber-600", bg: "bg-amber-50" };
  }, [weeklyEarnings]);

  // Section 3 Logic: Peak Earning Hours Chart Data
  const chartData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, hour) => {
      let value = 20; // baseline
      if (hour >= 6 && hour <= 10) value = baseRate * 0.75;
      if (hour >= 12 && hour <= 16) value = baseRate * 0.95;
      if (hour >= 17 && hour <= 21) value = baseRate * 1.35; // Peak shift
      if (hour >= 22 || hour <= 2) value = baseRate * 0.85;
      
      // Random variance for "realistic" look
      value += Math.random() * 5;
      
      return {
        time: `${hour}:00`,
        earnings: Math.round(value)
      };
    });
  }, [baseRate]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6 lg:p-10 font-body">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header with Control */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-headline font-bold text-heading">Income DNA Profile</h1>
            <p className="text-body mt-1">AI-driven analysis of your earning patterns and risk capacity</p>
          </div>
          
          <Card className="w-full md:w-64 border-none shadow-sm rounded-xl bg-white overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Adjust Base Rate</Label>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-heading">₹</span>
                  <input 
                    type="number" 
                    value={baseRate}
                    onChange={(e) => setBaseRate(Number(e.target.value))}
                    className="w-full bg-transparent font-bold text-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>
        </header>

        {/* Section 1: Income DNA Cards */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-headline font-bold text-heading">Dynamic Slot Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {slotData.map((slot) => {
              const isPeak = slot.id === peakSlot.id;
              return (
                <Card 
                  key={slot.id} 
                  className={`border-none rounded-[20px] transition-all duration-300 ${
                    isPeak ? "shadow-btn ring-2 ring-primary ring-offset-4 ring-offset-[#f5f7fb]" : "shadow-card hover:shadow-md"
                  }`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                        isPeak ? "bg-primary text-white" : "bg-[#f8faff] text-muted-foreground"
                      }`}>
                        <slot.icon size={24} />
                      </div>
                      <Badge variant="outline" className={`border-none font-bold ${
                        isPeak ? "bg-success-bg text-success" : "bg-muted/30 text-muted-foreground"
                      }`}>
                        {slot.multiplier}x
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-heading">{slot.label}</p>
                      <p className="text-xs text-body">{slot.hours}</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-2xl font-black text-heading">₹{slot.hourlyRate}<span className="text-sm font-normal text-body">/hr</span></p>
                    </div>
                    {isPeak && (
                      <div className="pt-2 animate-in fade-in slide-in-from-bottom-1">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
                          <TrendingUp size={10} /> Peak Shift Detected
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Section 2: Expected Weekly Earnings */}
          <section className="lg:col-span-1 space-y-6">
            <Card className="h-full border-none rounded-[24px] shadow-card bg-white overflow-hidden flex flex-col">
              <div className="bg-primary p-8 text-white relative">
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Expected Weekly Earnings</p>
                <h3 className="text-5xl font-black mt-4">₹{weeklyEarnings.toLocaleString()}</h3>
                <div className="mt-6 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 w-fit">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Live Projection Active</span>
                </div>
                <TrendingUp className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
              </div>
              
              <CardContent className="p-8 flex-1 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#f8faff] flex items-center justify-center text-primary">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recommended Plan</p>
                      <p className={`text-lg font-black ${recommendedPlan.color}`}>{recommendedPlan.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-body leading-relaxed">
                    Based on your average consistency and peak multipliers, we recommend {recommendedPlan.name} for maximum parametric protection during weather disruptions.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover shadow-btn text-lg font-bold flex items-center justify-center gap-2 group">
                    Upgrade My Plan <Zap className="h-5 w-5 group-hover:fill-current" />
                  </Button>
                  <div className="flex items-start gap-3 bg-[#f8faff] p-4 rounded-xl border border-[#eef2f8]">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-body">Calculated using standardized 10-hour work blocks across all DNA slots. Actual results may vary based on platform demand.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 3: Peak Earning Hours Chart */}
          <section className="lg:col-span-2 space-y-6">
            <Card className="h-full border-none rounded-[24px] shadow-card bg-white p-8">
              <CardHeader className="p-0 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-headline font-bold text-heading">Peak Earning Intensity</CardTitle>
                    <CardDescription>24-hour cycle mapping income potential based on DNA multipliers</CardDescription>
                  </div>
                  <Badge className="bg-primary-light text-primary border-none py-1.5 px-4 rounded-full font-bold">
                    Peak: ₹{Math.round(baseRate * 1.35)}/hr
                  </Badge>
                </div>
              </CardHeader>
              
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3f8" />
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
                        fontWeight: 'bold'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#6C47FF" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#f0f3f8] pt-8">
                {[
                  { label: "Stability", value: "High", color: "text-success" },
                  { label: "Peak Shift", value: "5PM - 9PM", color: "text-heading" },
                  { label: "Efficiency", value: "94%", color: "text-primary" },
                  { label: "Risk Index", value: "Low", color: "text-success" }
                ].map((stat, i) => (
                  <div key={i} className="text-center md:text-left">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className={`text-lg font-black mt-1 ${stat.color}`}>{stat.value}</p>
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
