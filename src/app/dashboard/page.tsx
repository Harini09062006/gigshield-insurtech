"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Shield, 
  Loader2, 
  Zap, 
  Sunrise, 
  Sunset, 
  Sun, 
  Moon, 
  Brain, 
  Home,
  FileText,
  Map as MapIcon,
  LogOut,
  ChevronRight,
  IndianRupee,
  RefreshCcw,
  Calendar,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// API Configuration
const WEATHER_API_KEY = "be5f61ff6b261dedfa89e321d466a063";

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();

  // 1. DATA STATE
  const [weather, setWeather] = useState({
    rainMM: 12,
    condition: "Light Rain",
    risk: 35
  });

  const [calc, setCalc] = useState({
    potentialLoss: 468,
    coverage: 240,
    remaining: 228
  });

  const profileRef = useMemoFirebase(() =>
    user ? doc(db, "users", user.uid) : null,
    [db, user?.uid]
  );
  const dnaRef = useMemoFirebase(() =>
    user ? doc(db, "income_dna", user.uid) : null,
    [db, user?.uid]
  );

  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  // Chart Data for Peak Earning Hours (Matching Reference Peaks)
  const chartData = [
    { time: '6 AM', evening: 10, lunch: 5, active: 20 },
    { time: '8 AM', evening: 15, lunch: 10, active: 35 },
    { time: '10 AM', evening: 20, lunch: 45, active: 45 },
    { time: '12 PM', evening: 30, lunch: 85, active: 55 },
    { time: '2 PM', evening: 35, lunch: 60, active: 50 },
    { time: '4 PM', evening: 55, lunch: 30, active: 60 },
    { time: '6 PM', evening: 95, lunch: 15, active: 85 },
    { time: '8 PM', evening: 80, lunch: 10, active: 75 },
    { time: '10 PM', evening: 40, lunch: 5, active: 45 },
    { time: '11 PM', evening: 25, lunch: 0, active: 30 },
  ];

  // 2. LOGIC: FETCH WEATHER
  const fetchWeather = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      }).catch(() => null);

      const lat = position?.coords.latitude || 19.0760;
      const lon = position?.coords.longitude || 72.8777;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();

      const rain = data.rain?.['1h'] || 0;
      const risk = rain > 20 ? 85 : rain > 5 ? 45 : 15;

      setWeather({
        rainMM: Math.round(rain) || 0,
        condition: data.weather[0]?.main || "Clear",
        risk: risk
      });

      calculateLoss(rain);
    } catch (e) {
      console.error("Weather fetch error", e);
    }
  };

  const calculateLoss = (rainMM: number) => {
    const baseRate = profile?.avg_hourly_earnings || 60;
    const eveningRate = dna?.evening_rate || baseRate * 1.3;
    const loss = Math.round((rainMM || 1) * 1.5 * eveningRate);
    setCalc({
      potentialLoss: loss,
      coverage: 240,
      remaining: Math.max(0, loss - 240)
    });
  };

  const simulateWeather = () => {
    const rain = 50 + Math.random() * 50;
    setWeather({
      rainMM: Math.round(rain),
      condition: "Heavy Rain",
      risk: 95
    });
    calculateLoss(rain);
  };

  useEffect(() => {
    if (user) fetchWeather();
  }, [user, dna]);

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  // DNA Slot Constants
  const dnaSlots = [
    { title: "MORNING", range: "6-10 AM", rate: dna?.morning_rate || 45, mult: "0.75x multiplier", color: "#F59E0B", icon: Sunrise },
    { title: "AFTERNOON", range: "12-4 PM", rate: dna?.afternoon_rate || 57, mult: "0.95x multiplier", color: "#3B82F6", icon: Sun },
    { title: "EVENING", range: "5-9 PM", rate: dna?.evening_rate || 78, mult: "1.30x multiplier", color: "#6C47FF", icon: Sunset },
    { title: "NIGHT", range: "9 PM-12 AM", rate: dna?.night_rate || 51, mult: "0.85x multiplier", color: "#60A5FA", icon: Moon },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f9] font-body text-[#1A1A2E]">
      
      {/* 1. TOP NAVBAR */}
      <header className="bg-white px-8 py-4 flex items-center justify-between border-b border-[#E8E6FF] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 bg-[#f0f2f9] text-[#6C47FF] rounded-xl"><Home className="h-5 w-5" /></Button>
          <Link href="/claims"><Button variant="ghost" size="icon" className="h-10 w-10 text-[#64748B] rounded-xl"><FileText className="h-5 w-5" /></Button></Link>
          <Link href="/heatmap"><Button variant="ghost" size="icon" className="h-10 w-10 text-[#64748B] rounded-xl"><MapIcon className="h-5 w-5" /></Button></Link>
          <Button onClick={() => auth.signOut()} variant="ghost" size="icon" className="h-10 w-10 text-[#EF4444] rounded-xl"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-10">
        
        {/* 2. PIXEL-PERFECT INCOME DNA SUMMARY SECTION */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Income DNA Profile</h2>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Updated 17:25</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {dnaSlots.map((slot, i) => (
              <Card key={i} className="bg-white border-none rounded-[20px] shadow-sm p-6 relative overflow-hidden flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gray-50 rounded-lg">
                    <slot.icon size={12} className="text-gray-400" />
                  </div>
                  <p className="text-[9px] font-black text-gray-400 tracking-wider uppercase">{slot.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">{slot.range}</p>
                  <p className="text-xl font-bold text-[#1A1A2E]">₹{slot.rate}/hr</p>
                </div>
                <p className="text-[9px] font-bold text-[#6C47FF]/60">{slot.mult}</p>
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: slot.color, opacity: 0.4 }} />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-6">
            {/* Left: Expected Earnings */}
            <Card className="bg-white border-none rounded-[20px] shadow-sm p-10 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">EXPECTED WEEKLY EARNINGS</p>
                <div className="text-7xl font-bold text-[#6C47FF]">₹3360</div>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mt-4 font-medium">
                  Derived from your Income DNA earning pattern
                </p>
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter mb-1">RECOMMENDED PLAN</p>
                  <p className="text-xl font-bold text-[#F59E0B]">Pro Shield</p>
                </div>
                <Button variant="outline" className="border-[1.5px] border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#6C47FF] hover:text-white rounded-xl px-8 h-12 transition-all text-sm">
                  Upgrade Plan
                </Button>
              </div>
            </Card>

            {/* Right: Peak Hours Chart */}
            <Card className="bg-white border-none rounded-[20px] shadow-sm p-8">
              <h3 className="text-sm font-bold text-[#1A1A2E] mb-10">Peak Earning Hours (24-Hour Profile)</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLunch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="evening" 
                      stroke="#6C47FF" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorEvening)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lunch" 
                      stroke="#F59E0B" 
                      strokeWidth={2.5} 
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
              <div className="mt-8 flex justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#6C47FF]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter">Evening peak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter">Lunch peak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-px w-3 border-t border-dashed border-[#94A3B8]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter">Active hours</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 3. PRIMARY INSIGHT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Active Protection Card */}
          <Card className="bg-[#6C47FF] text-white rounded-[24px] border-none p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <Shield className="absolute top-8 right-8 h-8 w-8 opacity-40" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Active Protection</p>
              <h2 className="text-3xl font-black uppercase">{profile?.plan_id ? profile.plan_id.toUpperCase() + " SHIELD" : "PRO SHIELD"}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <div className="bg-white/10 p-4 rounded-2xl">
                <p className="text-[9px] font-bold uppercase opacity-60 mb-1">Max Payout</p>
                <p className="text-lg font-black">₹{profile?.max_payout || 240}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl">
                <p className="text-[9px] font-bold uppercase opacity-60 mb-1">Premium</p>
                <p className="text-lg font-black">₹{profile?.premium || 25}</p>
              </div>
            </div>
          </Card>

          {/* AI Risk Prediction Card */}
          <Card className="bg-white rounded-[24px] border-none p-8 flex flex-col justify-between shadow-sm relative">
            <Brain className="absolute top-8 right-8 h-6 w-6 text-[#6C47FF]" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-2">AI Risk Prediction</p>
              <div className="flex items-center gap-4">
                <h2 className="text-5xl font-black text-[#1A1A2E]">{weather.rainMM}mm</h2>
                <Badge className="bg-[#EDE9FF] text-[#6C47FF] hover:bg-[#EDE9FF] border-none font-bold py-1 px-3">{weather.condition}</Badge>
              </div>
            </div>
            <div className="mt-10 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-[#64748B]">Disruption Risk</span>
                <span className="text-[#1A1A2E]">{weather.risk}%</span>
              </div>
              <Progress value={weather.risk} className="h-2.5 bg-[#f0f2f9]" indicatorClassName="bg-[#6C47FF]" />
            </div>
          </Card>

          {/* Commitment Status Card */}
          <Card className="bg-[#FFFBEA] rounded-[24px] border-none p-8 flex flex-col justify-between shadow-sm relative">
            <RefreshCcw className="absolute top-8 right-8 h-6 w-6 text-[#F59E0B]" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B] mb-2">Commitment Status</p>
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-[#1A1A2E]">Week 1 of 4</h2>
                <Badge className="bg-[#DCFCE7] text-[#22C55E] hover:bg-[#DCFCE7] border-none font-bold py-1 px-3">Renewal ON</Badge>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-[#FDE68A]">
              <p className="text-sm font-bold text-[#64748B] italic">Next Renewal: 25 Mar</p>
            </div>
          </Card>
        </div>

        {/* 4. POLICY MANAGEMENT SECTION */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold">Policy Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "Activation Date", value: "Mar 18, 2026", icon: Calendar },
              { label: "Next Renewal", value: "25 Mar", icon: RefreshCcw },
              { label: "Renewal Amount", value: "₹25", icon: IndianRupee },
              { label: "Commitment", value: "Week 1/4", icon: Info },
            ].map((stat, i) => (
              <Card key={i} className="bg-white border-none rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 bg-[#f0f2f9] rounded-xl flex items-center justify-center text-[#6C47FF]">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">{stat.label}</p>
                  <p className="text-base font-bold text-[#1A1A2E]">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 5. EARNINGS PROTECTION SUMMARY */}
        <Card className="bg-[#f0f2f9] rounded-[24px] border border-[#E8E6FF] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold">Earnings Protection Summary</h3>
            <Badge className="bg-[#6C47FF] text-white hover:bg-[#6C47FF] border-none font-bold py-1.5 px-4 rounded-full text-[11px]">
              DNA Rate: ₹{dna?.evening_rate || 78}/hr (Evening Peak)
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Potential Income Loss</p>
              <p className="text-4xl font-black text-[#EF4444]">₹{calc.potentialLoss}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Insurance Coverage</p>
              <p className="text-4xl font-black text-[#22C55E]">₹{calc.coverage}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Remaining Risk</p>
              <p className="text-4xl font-black text-[#EF4444]">₹{calc.remaining}</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-center pb-10">
          <Button 
            onClick={simulateWeather}
            className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold rounded-xl shadow-btn px-10 py-6"
          >
            <Zap className="mr-2 h-4 w-4 fill-current" /> Simulate Severe Weather
          </Button>
        </div>

      </main>

      {/* 6. FLOATING AI ASSISTANT */}
      <Button 
        className="fixed bottom-10 right-10 h-16 w-16 bg-[#6C47FF] rounded-full shadow-2xl flex items-center justify-center text-white"
      >
        <Brain className="h-8 w-8" />
      </Button>

    </div>
  );
}
