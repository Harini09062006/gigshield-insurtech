
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
  BarChart,
  Bar,
  Cell
} from "recharts";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IncomeDNAProfile() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // 1. Data Subscriptions
  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const dnaRef = useMemoFirebase(() => user ? doc(db, "income_dna", user.uid) : null, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  // 2. Dynamic Logic
  const baseRate = profile?.avg_hourly_earnings || 60;
  
  const slots = useMemo(() => [
    { id: "morning", title: "MORNING", range: "6-10 AM", rate: dna?.morning_rate || Math.round(baseRate * 0.75), icon: Sunrise },
    { id: "afternoon", title: "AFTERNOON", range: "12-4 PM", rate: dna?.afternoon_rate || Math.round(baseRate * 0.95), icon: Sun },
    { id: "evening", title: "EVENING", range: "5-9 PM", rate: dna?.evening_rate || Math.round(baseRate * 1.30), icon: Sunset },
    { id: "night", title: "NIGHT", range: "9 PM-12 AM", rate: dna?.night_rate || Math.round(baseRate * 0.85), icon: Moon },
  ], [dna, baseRate]);

  const hourlyChartData = [
    { hour: '6am', earning: 40 }, { hour: '8am', earning: 45 }, { hour: '10am', earning: 55 },
    { hour: '12pm', earning: 50 }, { hour: '2pm', earning: 52 }, { hour: '4pm', earning: 60 },
    { hour: '6pm', earning: 85 }, { hour: '8pm', earning: 95 }, { hour: '10pm', earning: 65 },
    { hour: '12am', earning: 45 }
  ];

  const weeklyChartData = [
    { day: 'Mon', earning: 600 }, { day: 'Tue', earning: 550 }, { day: 'Wed', earning: 580 },
    { day: 'Thu', earning: 620 }, { day: 'Fri', earning: 800 }, { day: 'Sat', earning: 1100 },
    { day: 'Sun', earning: 950 }
  ];

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-10 flex items-center justify-center">
        <Activity className="animate-spin text-[#6d28d9] h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP ROW: HERO + 2x2 GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Hero Card */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between h-full">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">EXPECTED WEEKLY EARNINGS</p>
              <div className="text-5xl font-bold text-[#6d28d9]">₹4725</div>
              <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                Derived from your unique Income DNA earning patterns across all active delivery shifts.
              </p>
            </div>
            
            <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">STATUS</p>
                <p className="text-lg font-bold text-[#22C55E]">High Consistency</p>
              </div>
              <Button variant="outline" className="border-[#6d28d9] text-[#6d28d9] font-bold hover:bg-[#6d28d9]/5 rounded-xl px-6 h-12 transition-all">
                View DNA Details
              </Button>
            </div>
          </Card>

          {/* 2x2 Grid of Time Cards */}
          <div className="grid grid-cols-2 gap-6">
            {slots.map((slot) => (
              <Card key={slot.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between overflow-hidden relative">
                <div className="space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                    <slot.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{slot.title}</p>
                    <p className="text-[11px] text-gray-400 mb-2">{slot.range}</p>
                    <p className="text-2xl font-bold text-gray-800">₹{slot.rate}/hr</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* BOTTOM ROW: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Line Chart Card */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-8">PEAK EARNING HOURS</CardTitle>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earning" 
                    stroke="#6d28d9" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorEarning)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bar Chart Card */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-8">BEST WORKING DAYS</CardTitle>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 800 }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8f9fc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} 
                  />
                  <Bar dataKey="earning" radius={[6, 6, 0, 0]}>
                    {weeklyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index > 4 ? '#F59E0B' : '#6d28d9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
