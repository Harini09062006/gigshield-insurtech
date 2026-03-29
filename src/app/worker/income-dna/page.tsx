"use client";

import React, { useMemo } from "react";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  ArrowUpRight, 
  Info,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ChevronRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * PROFESSIONAL INCOME INTELLIGENCE DASHBOARD
 * A real-world model focusing on earning velocity, consistency, and optimization.
 */
export default function ProfessionalIncomeDNA() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // 1. Live Data Subscriptions
  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const dnaRef = useMemoFirebase(() => user ? doc(db, "income_dna", user.uid) : null, [db, user?.uid]);

  const { data: profile, isLoading: loadingProfile } = useDoc(profileRef);
  const { data: dna, isLoading: loadingDna } = useDoc(dnaRef);

  // 2. Logic: Real-world Performance Mapping
  const baseRate = profile?.avg_hourly_earnings || 60;
  
  const metrics = useMemo(() => [
    { label: "Weekly Avg", value: `₹${dna?.weekly_earnings || 3360}`, trend: "+4.2%", positive: true },
    { label: "Reliability Index", value: "84%", trend: "Stable", positive: true },
    { label: "Surge Match", value: "92%", trend: "High", positive: true }
  ], [dna]);

  const slotBreakdown = useMemo(() => [
    { id: "morning", title: "Morning", range: "06:00 - 10:00", rate: dna?.morning_rate || 45, icon: Sunrise, color: "#F59E0B", velocity: "+8%" },
    { id: "afternoon", title: "Afternoon", range: "12:00 - 16:00", rate: dna?.afternoon_rate || 57, icon: Sun, color: "#3B82F6", velocity: "+12%" },
    { id: "evening", title: "Evening Peak", range: "17:00 - 21:00", rate: dna?.evening_rate || 78, icon: Sunset, color: "#6C47FF", velocity: "+24%", active: true },
    { id: "night", title: "Night Shift", range: "21:00 - 00:00", rate: dna?.night_rate || 51, icon: Moon, color: "#1E293B", velocity: "+5%" },
  ], [dna]);

  const chartData = [
    { hour: "06:00", velocity: 30, baseline: 25 },
    { hour: "09:00", velocity: 55, baseline: 40 },
    { hour: "12:00", velocity: 65, baseline: 50 },
    { hour: "15:00", velocity: 60, baseline: 45 },
    { hour: "18:00", velocity: 95, baseline: 70 },
    { hour: "21:00", velocity: 75, baseline: 55 },
    { hour: "00:00", velocity: 40, baseline: 30 },
  ];

  const weeklyData = [
    { day: "Mon", val: 600 }, { day: "Tue", val: 550 }, { day: "Wed", val: 580 },
    { day: "Thu", val: 620 }, { day: "Fri", val: 800 }, { day: "Sat", val: 1100 }, { day: "Sun", val: 950 }
  ];

  if (isUserLoading || loadingProfile || loadingDna) {
    return (
      <div className="p-10 space-y-8 bg-[#F8FAFC] min-h-screen">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-body text-[#1E293B]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER: CONTEXTUAL TITLE */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-tight text-[#0F172A]">Income Intelligence</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time analysis of earning velocity and protection eligibility.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-slate-200 bg-white rounded-xl font-bold text-xs h-10 px-4 gap-2 text-slate-600 hover:bg-slate-50 shadow-sm">
              <Calendar size={14} /> Last 30 Days
            </Button>
            <Button className="bg-[#6C47FF] hover:bg-[#5535E8] rounded-xl font-bold text-xs h-10 px-6 shadow-btn transition-all active:scale-95">
              Generate Report
            </Button>
          </div>
        </header>

        {/* TOP ROW: KEY PERFORMANCE INDICATORS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((m, i) => (
            <Card key={i} className="border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden group hover:border-[#6C47FF]/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</p>
                  <Badge className={`rounded-full px-2 py-0 h-5 border-none text-[10px] font-black ${m.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-red-600'}`}>
                    {m.trend}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-[#0F172A]">{m.value}</h3>
                  <TrendingUp size={16} className="text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* MAIN WORKSPACE: 2-COLUMN ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: EARNING DNA & PATTERNS (8 COLS) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* THE DNA GRID */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity size={14} /> Shift Performance DNA
                </h2>
                <span className="text-[10px] font-bold text-slate-400">Live Matching Active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {slotBreakdown.map((slot) => (
                  <Card key={slot.id} className={`border-slate-200/60 shadow-sm rounded-[20px] transition-all bg-white relative overflow-hidden ${slot.active ? 'ring-2 ring-[#6C47FF]/10 border-[#6C47FF]/30' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${slot.color}15`, color: slot.color }}>
                          <slot.icon size={20} />
                        </div>
                        <Badge className="bg-slate-50 text-slate-500 border-none font-bold text-[9px] uppercase tracking-tighter">
                          {slot.velocity}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{slot.title}</p>
                        <p className="text-2xl font-black text-[#0F172A]">₹{slot.rate}<span className="text-xs font-medium text-slate-400 ml-1">/hr</span></p>
                        <p className="text-[9px] font-medium text-slate-400">{slot.range}</p>
                      </div>
                      {slot.active && (
                        <div className="absolute top-0 right-0 p-1">
                          <Zap size={12} className="text-[#6C47FF] fill-[#6C47FF]" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* PEAK HOURS VISUALIZATION */}
            <Card className="border-slate-200/60 shadow-sm rounded-[24px] bg-white overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-[#0F172A]">Peak Earning Velocity</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">24-hour revenue intensity profile vs market baseline.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[#6C47FF]" /><span className="text-[10px] font-bold text-slate-500 uppercase">You</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-200" /><span className="text-[10px] font-bold text-slate-500 uppercase">Baseline</span></div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="baseline" stroke="#E2E8F0" strokeWidth={2} fill="#F8FAFC" />
                      <Area type="monotone" dataKey="velocity" stroke="#6C47FF" strokeWidth={3} fill="url(#colorVel)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: INSIGHTS & OPTIMIZATION (4 COLS) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* OPTIMIZATION ENGINE */}
            <Card className="border-none shadow-card rounded-[24px] bg-[#0F172A] text-white p-8 relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                  <Badge className="bg-[#6C47FF] text-white border-none font-bold text-[9px] uppercase px-3 py-0.5 rounded-full mb-2">AI Optimization</Badge>
                  <h3 className="text-2xl font-bold leading-tight">Maximize Shift Efficiency</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">Your DNA patterns suggest an earning gap on Wednesday afternoons.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Target size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Smarter Shift: Sat 6pm</p>
                      <p className="text-[10px] text-slate-400 mt-1">Historically ₹92/hr in your zone. High demand predicted.</p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start opacity-60">
                    <div className="h-8 w-8 rounded-lg bg-[#6C47FF]/20 flex items-center justify-center shrink-0">
                      <TrendingUp size={16} className="text-[#6C47FF]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Growth Potential: +₹420/wk</p>
                      <p className="text-[10px] text-slate-400 mt-1">Adjust your Monday night slot to match surge timings.</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#6C47FF] hover:bg-[#5535E8] rounded-xl font-bold h-12 gap-2 group transition-all">
                  Optimize Schedule <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <ShieldCheck className="absolute -right-8 -bottom-8 h-48 w-48 opacity-5 -rotate-12" />
            </Card>

            {/* WEEKLY ACTIVITY BREAKDOWN */}
            <Card className="border-slate-200/60 shadow-sm rounded-[24px] bg-white">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-sm font-bold text-[#0F172A] uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-[#6C47FF]" /> Active Work Days
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 800 }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                      <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                        {weeklyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index > 4 ? '#F59E0B' : '#6C47FF'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Consistency: High</span>
                  </div>
                  <button className="text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest flex items-center gap-1 hover:underline">
                    Manage Targets <ChevronRight size={10} />
                  </button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
