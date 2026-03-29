"use client";

import React, { useEffect, useState } from "react";
import { 
  Shield, 
  Loader2, 
  Zap, 
  AlertCircle, 
  TrendingUp, 
  Info, 
  Sun, 
  Sunset, 
  Sunrise, 
  Moon, 
  Brain, 
  ChevronRight, 
  Activity,
  Home,
  FileText,
  Map as MapIcon,
  LogOut,
  RefreshCcw,
  Calendar,
  IndianRupee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { format } from "date-fns";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
        
        {/* 2. PROFILE HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome back, {profile?.name || "User"}</h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-medium text-[#64748B]">Active on {profile?.platform || 'Zomato'} in {profile?.city || 'Howrah'}</p>
            </div>
          </div>
          <Button 
            onClick={simulateWeather}
            className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold rounded-xl shadow-btn px-6 py-6"
          >
            <Zap className="mr-2 h-4 w-4 fill-current" /> Simulate Severe Weather
          </Button>
        </div>

        {/* 3. PRIMARY CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
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
