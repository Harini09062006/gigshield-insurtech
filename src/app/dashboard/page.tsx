"use client";

import React, { useEffect, useState } from "react";
import { Shield, Loader2, Zap, AlertCircle, TrendingUp, Info, Sun, Sunset, Sunrise, Moon, Brain, ChevronRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { format } from "date-fns";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

// API Configuration
const WEATHER_API_KEY = "be5f61ff6b261dedfa89e321d466a063";

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // 1. DATA STATE
  const [weather, setWeather] = useState({
    rainMM: 0,
    condition: "Syncing...",
    risk: 0
  });

  const [calc, setCalc] = useState({
    potentialLoss: 0,
    coverage: 240,
    remaining: 0
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

  // 2. LOGIC: CALCULATE WEEKLY EARNINGS
  const baseRate = profile?.avg_hourly_earnings || 60;
  const weeklyEarnings =
    (dna?.morning_rate || baseRate * 0.75) * 2 * 7 +
    (dna?.afternoon_rate || baseRate * 0.95) * 3 * 7 +
    (dna?.evening_rate || baseRate * 1.3) * 4 * 7 +
    (dna?.night_rate || baseRate * 0.85) * 2 * 7;

  // 3. LOGIC: FETCH WEATHER
  const fetchWeather = async () => {
    try {
      // Get location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      }).catch(() => null);

      const lat = position?.coords.latitude || 19.0760; // Fallback to Mumbai
      const lon = position?.coords.longitude || 72.8777;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();

      const rain = data.rain?.['1h'] || 0;
      const risk = rain > 20 ? 85 : rain > 5 ? 45 : 15;

      setWeather({
        rainMM: rain,
        condition: data.weather[0]?.main || "Clear",
        risk: risk
      });

      calculateLoss(rain);
    } catch (e) {
      console.error("Weather fetch error", e);
      setWeather({ rainMM: 0, condition: "Clear", risk: 10 });
    }
  };

  const calculateLoss = (rainMM: number) => {
    const eveningRate = dna?.evening_rate || baseRate * 1.3;
    const loss = Math.round(rainMM * 1.5 * eveningRate); // Logic: hours lost scaled by intensity
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

  const hourlyChartData = [
    { hour: "6am", earning: 40 },
    { hour: "8am", earning: 45 },
    { hour: "10am", earning: 55 },
    { hour: "12pm", earning: 50 },
    { hour: "2pm", earning: 52 },
    { hour: "4pm", earning: 60 },
    { hour: "6pm", earning: 85 },
    { hour: "8pm", earning: 95 },
    { hour: "10pm", earning: 65 }
  ];

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6 space-y-8 font-body">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">
          Welcome back, {profile?.name || "User"}
        </h1>
        <Button 
          onClick={simulateWeather}
          className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold rounded-xl shadow-btn"
        >
          🌧 Simulate Severe Weather <Zap className="ml-2 h-4 w-4 fill-current" />
        </Button>
      </div>

      {/* ================= NEW CLEAN INCOME DNA SUMMARY SECTION ================= */}
      <section className="space-y-6 bg-[#eef0f7] -mx-6 -mt-4 p-8 rounded-b-[40px] shadow-sm mb-10 border-b border-[#E8E6FF]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Income DNA Profile</h2>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Updated Today, {format(new Date(), "HH:mm")}</p>
          </div>

          {/* Top Row: 4 Horizontal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "MORNING", range: "6-10 AM", rate: dna?.morning_rate || 45, mult: "0.75x multiplier", color: "#F59E0B", icon: Sunrise },
              { title: "AFTERNOON", range: "12-4 PM", rate: dna?.afternoon_rate || 57, mult: "0.95x multiplier", color: "#3B82F6", icon: Sun },
              { title: "EVENING", range: "5-9 PM", rate: dna?.evening_rate || 78, mult: "1.30x multiplier", color: "#6C47FF", icon: Sunset },
              { title: "NIGHT", range: "9 PM-12 AM", rate: dna?.night_rate || 51, mult: "0.85x multiplier", color: "#60A5FA", icon: Moon },
            ].map((slot, i) => (
              <Card key={i} className="bg-white border-none rounded-[20px] shadow-sm p-6 relative overflow-hidden flex flex-col gap-3 group hover:shadow-md transition-all">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-50 rounded-lg">
                    <slot.icon size={14} className="text-gray-400" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{slot.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">{slot.range}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1A1A2E]">₹{slot.rate}</span>
                    <span className="text-sm font-bold text-[#1A1A2E]">/hr</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-[#6C47FF]/60">{slot.mult}</p>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slot.color }} />
              </Card>
            ))}
          </div>

          {/* Bottom Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Expected Weekly Earnings Hero Card */}
            <Card className="bg-white border-none rounded-[20px] shadow-sm p-10 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">EXPECTED WEEKLY EARNINGS</p>
                <div className="text-7xl font-bold text-[#6C47FF]">₹{Math.round(weeklyEarnings)}</div>
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

            {/* Right: Peak Earning Hours Dual Chart */}
            <Card className="bg-white border-none rounded-[20px] shadow-sm p-8">
              <h3 className="text-sm font-bold text-[#1A1A2E] mb-10">Peak Earning Hours (24-Hour Profile)</h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { time: '6 AM', evening: 10, lunch: 5 },
                    { time: '8 AM', evening: 15, lunch: 10 },
                    { time: '10 AM', evening: 20, lunch: 25 },
                    { time: '12 PM', evening: 30, lunch: 75 },
                    { time: '2 PM', evening: 35, lunch: 60 },
                    { time: '4 PM', evening: 50, lunch: 30 },
                    { time: '6 PM', evening: 95, lunch: 15 },
                    { time: '8 PM', evening: 85, lunch: 10 },
                    { time: '10 PM', evening: 40, lunch: 5 },
                    { time: '11 PM', evening: 25, lunch: 0 },
                  ]}>
                    <defs>
                      <linearGradient id="colorEveningNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLunchNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} padding={{ left: 20, right: 20 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="evening" stroke="#6C47FF" strokeWidth={2} fillOpacity={1} fill="url(#colorEveningNew)" />
                    <Area type="monotone" dataKey="lunch" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorLunchNew)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 flex justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#6C47FF]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Evening peak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Lunch peak</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ================= EXISTING DASHBOARD SECTIONS ================= */}
      
      {/* 1. WEATHER & PROTECTION STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Weather Card */}
        <Card className="bg-white rounded-2xl shadow-card p-6 border-none">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase">Live Weather</CardTitle>
            <Sun className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-bold text-[#1A1A2E]">{weather.rainMM}mm</h2>
              <p className="text-sm font-bold text-[#6C47FF] mt-1">{weather.condition}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400">DISRUPTION RISK</p>
              <p className={`text-xl font-bold ${weather.risk > 50 ? "text-red-500" : "text-green-500"}`}>{weather.risk}%</p>
            </div>
          </div>
        </Card>

        {/* Protection Summary */}
        <Card className="bg-[#EDE9FF] rounded-2xl shadow-card p-6 border-none md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold text-[#6C47FF] uppercase">Potential Income Loss</p>
              <h2 className="text-3xl font-bold text-[#1A1A2E] mt-1">₹{calc.potentialLoss}</h2>
              <p className="text-[10px] text-gray-500 mt-1">Based on current intensity</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6C47FF] uppercase">Plan Coverage</p>
              <h2 className="text-3xl font-bold text-[#22C55E] mt-1">₹{calc.coverage}</h2>
              <p className="text-[10px] text-gray-500 mt-1">Pro Shield Max Limit</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6C47FF] uppercase">Remaining Risk</p>
              <h2 className="text-3xl font-bold text-red-500 mt-1">₹{calc.remaining}</h2>
              <p className="text-[10px] text-gray-500 mt-1">Unprotected gap</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ================= DNA PROFILE (ORIGINAL) ================= */}
      <section className="space-y-6">

        <h2 className="text-xl font-bold">Historical Income DNA</h2>

        {/* TOP 4 CARDS */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "MORNING", time: "6-10 AM", rate: dna?.morning_rate || 45, mult: "0.75x", color: "border-orange-300" },
            { label: "AFTERNOON", time: "12-4 PM", rate: dna?.afternoon_rate || 57, mult: "0.95x", color: "border-blue-300" },
            { label: "EVENING", time: "5-9 PM", rate: dna?.evening_rate || 78, mult: "1.30x", color: "border-purple-300" },
            { label: "NIGHT", time: "9 PM-12 AM", rate: dna?.night_rate || 51, mult: "0.85x", color: "border-indigo-300" }
          ].map((slot, i) => (
            <Card key={i} className={`bg-white rounded-2xl border ${slot.color} p-4 shadow-sm`}>
              <p className="text-xs text-gray-400 font-bold">{slot.label}</p>
              <p className="text-xs text-gray-400">{slot.time}</p>
              <h2 className="text-lg font-bold mt-2">₹{slot.rate}/hr</h2>
              <p className="text-xs text-purple-500 mt-1">
                {slot.mult} multiplier
              </p>
            </Card>
          ))}
        </div>

        {/* BELOW */}
        <div className="grid grid-cols-2 gap-6">

          {/* Earnings Analytics */}
          <Card className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase">Consistency Index</p>
                <p className="text-lg font-bold text-[#22C55E]">High Consistency</p>
              </div>
              <Link href="/worker/income-dna">
                <Button variant="outline" className="border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#EDE9FF] rounded-xl">
                  View DNA Details
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Weekly Target</span>
                <span className="font-bold">₹{Math.round(weeklyEarnings)}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#6C47FF] h-full" style={{ width: '85%' }} />
              </div>
              <p className="text-[10px] text-gray-400 italic">Target achievement based on typical 40-hour work week model.</p>
            </div>
          </Card>

          {/* Chart */}
          <Card className="bg-white rounded-2xl p-6 shadow-sm border">
            <CardTitle className="text-sm font-bold mb-4">
              Peak Earning Hours
            </CardTitle>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChartData}>
                  <XAxis dataKey="hour" />
                  <YAxis hide />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="earning"
                    stroke="#7c3aed"
                    fillOpacity={0.1}
                    fill="#7c3aed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </section>

    </div>
  );
}
