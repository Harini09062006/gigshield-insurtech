"use client";

import React from "react";
import { 
  Shield, 
  Home, 
  FileText, 
  Map as MapIcon, 
  LogOut, 
  Zap, 
  Brain, 
  AlertCircle, 
  TrendingUp, 
  ChevronRight, 
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function WorkerDashboard() {
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

  return (
    <div className="min-h-screen bg-[#EEEEFF] flex flex-col font-body">
      {/* 1. HEADER */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[#6C47FF] bg-[#EDE9FF]">
            <Home className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#64748B]">
            <FileText className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#64748B]">
            <MapIcon className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#EF4444]">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {/* 2. TOP 3 CARDS */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Purple Gradient */}
          <Card className="bg-gradient-to-br from-[#6C47FF] to-[#8B66FF] text-white border-none shadow-btn rounded-[20px] p-6 overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Active Protection</p>
              <h3 className="text-2xl font-bold mb-4">PRO SHIELD</h3>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[9px] uppercase opacity-60 font-bold mb-1">Max Payout</p>
                  <p className="text-lg font-bold">₹240</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[9px] uppercase opacity-60 font-bold mb-1">Premium</p>
                  <p className="text-lg font-bold">₹25</p>
                </div>
              </div>
            </div>
            <Shield className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
          </Card>
          
          {/* Card 2: White AI Risk */}
          <Card className="bg-white border-[#E8E6FF] shadow-card rounded-[20px] p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">AI Risk Prediction</p>
              <Brain className="h-5 w-5 text-[#6C47FF]" />
            </div>
            <div className="flex justify-between items-end mb-4">
              <div className="text-4xl font-bold text-[#1A1A2E]">12mm</div>
              <Badge className="bg-[#EDE9FF] text-[#6C47FF] border-none font-bold px-3 py-1">Light Rain</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-[#64748B]">
                <span>Disruption Probability</span>
                <span>35%</span>
              </div>
              <Progress value={35} className="h-2 bg-[#F1F0FF]" />
            </div>
          </Card>

          {/* Card 3: Light Yellow Commitment */}
          <Card className="bg-[#FFFBEA] border-[#FEF3C7] shadow-card rounded-[20px] p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">Commitment Status</p>
              <Zap className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-[#1A1A2E]">Week 1 of 4</div>
                <p className="text-[10px] text-[#64748B] mt-1">Automatic Renewal <span className="text-[#22C55E] font-bold">ON</span></p>
              </div>
              <div className="flex gap-1.5 pt-2">
                {[1, 2, 3, 4].map((w) => (
                  <div key={w} className={`h-1.5 flex-1 rounded-full ${w === 1 ? 'bg-[#F59E0B]' : 'bg-[#FDE68A]'}`} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* 3. POLICY MANAGEMENT ROW */}
        <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Activation Date", value: "Mar 18, 2026", icon: Calendar },
            { label: "Next Renewal", value: "25 Mar", icon: Clock },
            { label: "Renewal Amount", value: "₹25", icon: TrendingUp },
            { label: "Commitment", value: "Week 1/4", icon: Shield }
          ].map((stat, i) => (
            <Card key={i} className="bg-white border-[#E8E6FF] shadow-sm p-4 rounded-2xl flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={12} className="text-[#6C47FF]" />
                <p className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-tight">{stat.label}</p>
              </div>
              <p className="text-sm font-bold text-[#1A1A2E]">{stat.value}</p>
            </Card>
          ))}
        </section>

        {/* 4. EARNINGS PROTECTION SUMMARY */}
        <Card className="bg-[#F8F9FF] border border-[#E8E6FF] shadow-card rounded-[24px] overflow-hidden">
          <CardHeader className="bg-white border-b border-[#E8E6FF] px-8 py-5">
            <CardTitle className="text-lg font-headline font-bold text-[#1A1A2E]">Earnings Protection Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Potential Income Loss</p>
                <p className="text-3xl font-bold text-[#EF4444]">₹468</p>
                <p className="text-[10px] text-[#94A3B8]">Based on Evening DNA rate (6 hrs)</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Insurance Coverage</p>
                <p className="text-3xl font-bold text-[#22C55E]">₹240</p>
                <p className="text-[10px] text-[#94A3B8]">Capped by PRO Shield plan limit</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Remaining Risk</p>
                <p className="text-3xl font-bold text-[#EF4444]">₹228</p>
                <p className="text-[10px] text-[#94A3B8]">Uncovered amount during event</p>
              </div>
            </div>
            
            <div className="bg-[#FFFBEA] border border-[#FEF3C7] p-4 rounded-2xl flex items-center gap-4">
              <div className="h-10 w-10 bg-[#FEF3C7] rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="text-[#F59E0B] h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-[#D97706] leading-relaxed">
                <span className="font-bold">Pro Tip:</span> Consider upgrading to <span className="font-bold">Elite Shield</span> to cover your evening peak income completely during heavy monsoons.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 5. INCOME DNA PROFILE */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-headline font-bold text-[#1A1A2E]">Income DNA Profile</h2>
              <Badge className="bg-[#6C47FF] text-white border-none text-[10px] font-bold uppercase py-0.5 px-3">Live Analysis</Badge>
            </div>
            <p className="text-[10px] text-[#94A3B8] font-mono font-bold uppercase tracking-widest">Refreshed 2m ago</p>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Morning (6-10 AM)", rate: "₹45/hr", icon: "🌅", progress: 45 },
              { label: "Afternoon (12-4 PM)", rate: "₹57/hr", icon: "☀", progress: 57 },
              { label: "Evening (5-9 PM)", rate: "₹78/hr", icon: "🌆", progress: 78 },
              { label: "Night (9 PM-12 AM)", rate: "₹51/hr", icon: "🌙", progress: 51 }
            ].map((slot, i) => (
              <Card key={i} className="bg-white border-[#E8E6FF] shadow-sm p-5 rounded-2xl">
                <div className="text-2xl mb-3">{slot.icon}</div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-1">{slot.label}</p>
                <p className="text-xl font-bold text-[#1A1A2E]">{slot.rate}</p>
                <div className="h-1 w-full bg-[#F1F0FF] rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-[#6C47FF]" style={{ width: `${slot.progress}%` }} />
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-[#E8E6FF] shadow-card rounded-[24px] p-6">
              <CardTitle className="text-sm font-bold text-[#1A1A2E] mb-6 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-[#6C47FF]" /> Peak Earning Hours
              </CardTitle>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyChartData}>
                    <defs>
                      <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 700 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="earning" stroke="#6C47FF" strokeWidth={3} fillOpacity={1} fill="url(#colorEarning)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-white border-[#E8E6FF] shadow-card rounded-[24px] p-6">
              <CardTitle className="text-sm font-bold text-[#1A1A2E] mb-6 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-[#6C47FF]" /> Best Working Days
              </CardTitle>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1A1A2E', fontWeight: 800 }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#F8F9FF' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                    <Bar dataKey="earning" radius={[6, 6, 0, 0]}>
                      {weeklyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index > 4 ? '#F59E0B' : '#6C47FF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="px-8 py-6 text-center text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest bg-white border-t border-[#E8E6FF]">
        © 2026 GigShield Protection • System ID: GS-0042
      </footer>
    </div>
  );
}