
"use client";

import React, { useState, useMemo } from "react";
import { 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon, 
  Activity,
  Shield,
  IndianRupee,
  Zap,
  Info,
  AlertTriangle
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
import { Input } from "@/components/ui/input";

/**
 * ENHANCED PIXEL-PERFECT INCOME DNA
 * Features: Dynamic hours input, Razorpay integration, and AI insights.
 */
export default function IncomeDNAProfile() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // CORE LOGIC CONSTANTS
  const BASE_RATE = 60;
  const MULTIPLIERS = {
    morning: 0.75,
    afternoon: 0.95,
    evening: 1.3,
    night: 0.85
  };

  // STATE FOR WORKING HOURS
  const [hours, setHours] = useState({
    morning: 4,
    afternoon: 4,
    evening: 4,
    night: 3
  });

  const totalHours = hours.morning + hours.afternoon + hours.evening + hours.night;

  // CALCULATION LOGIC
  const calculateDailyEarnings = () => {
    return (
      (hours.morning * BASE_RATE * MULTIPLIERS.morning) +
      (hours.afternoon * BASE_RATE * MULTIPLIERS.afternoon) +
      (hours.evening * BASE_RATE * MULTIPLIERS.evening) +
      (hours.night * BASE_RATE * MULTIPLIERS.night)
    );
  };

  const weeklyEarnings = Math.round(calculateDailyEarnings() * 7);

  // SMART INSIGHT MESSAGE
  const getInsight = () => {
    if (totalHours === 0) return null;
    if (hours.evening > hours.morning && hours.evening > hours.afternoon) {
      return "You are working in peak hours — maximizing earnings 🚀";
    }
    return "Tip: Shift more hours to Evening Peak (1.3x) to increase payouts.";
  };

  // RAZORPAY INTEGRATION
  const handleRazorpay = () => {
    if (totalHours === 0) return;

    if (!(window as any).Razorpay) {
      alert("Payment gateway loading... please try again in a moment.");
      return;
    }

    const options = {
      key: "rzp_test_SY9JJx7GKLL2Jm",
      amount: weeklyEarnings * 100,
      currency: "INR",
      name: "GigShield Income DNA",
      description: "Automated Worker Payout Simulation",
      handler: function (response: any) {
        alert(`Payment Successful ✅\nTransaction ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: profile?.name || "Gig Worker",
        contact: profile?.phone || "9999999999",
      },
      theme: {
        color: "#6C47FF"
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const slots = [
    { id: "morning", title: "MORNING", range: "6-10 AM", rate: Math.round(BASE_RATE * MULTIPLIERS.morning), mult: `${MULTIPLIERS.morning}x multiplier`, color: "#F59E0B", icon: Sunrise },
    { id: "afternoon", title: "AFTERNOON", range: "12-4 PM", rate: Math.round(BASE_RATE * MULTIPLIERS.afternoon), mult: `${MULTIPLIERS.afternoon}x multiplier`, color: "#3B82F6", icon: Sun },
    { id: "evening", title: "EVENING", range: "5-9 PM", rate: Math.round(BASE_RATE * MULTIPLIERS.evening), mult: `${MULTIPLIERS.evening}x multiplier`, color: "#6C47FF", icon: Sunset },
    { id: "night", title: "NIGHT", range: "9 PM-12 AM", rate: Math.round(BASE_RATE * MULTIPLIERS.night), mult: `${MULTIPLIERS.night}x multiplier`, color: "#60A5FA", icon: Moon },
  ];

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
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Live Dynamic Audit</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {slots.map((slot) => (
              <Card key={slot.id} className="bg-white border-none rounded-[20px] shadow-sm p-6 relative overflow-hidden flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-50 rounded-lg">
                      <slot.icon size={14} className="text-gray-400" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 tracking-wider">{slot.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 mb-1">{slot.range}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-[#1A1A2E]">₹{slot.rate}</span>
                      <span className="text-[10px] font-bold text-[#1A1A2E]">/hr</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Hrs Worked/Day</p>
                  <Input 
                    type="number" 
                    min="0"
                    value={(hours as any)[slot.id.toLowerCase()]}
                    onChange={(e) => setHours(prev => ({...prev, [slot.id.toLowerCase()]: Math.max(0, parseInt(e.target.value) || 0)}))}
                    className="h-9 text-xs font-bold rounded-xl border-[#E8E6FF] bg-[#F8F9FF] focus:border-[#6C47FF]"
                  />
                </div>

                <p className="text-[10px] font-bold text-[#6C47FF]/60">{slot.mult}</p>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slot.color }} />
              </Card>
            ))}
          </div>
        </div>

        {/* MAIN SECTION: 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: EXPECTED EARNINGS */}
          <Card className="bg-white border-none rounded-[20px] shadow-sm p-10 flex flex-col justify-between relative overflow-hidden">
            <Shield className="absolute -top-10 -right-10 h-40 w-40 text-[#6C47FF] opacity-[0.03]" />
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">EXPECTED WEEKLY EARNINGS</p>
                {totalHours === 0 ? (
                  <div className="flex items-center gap-3 text-[#F59E0B]">
                    <AlertTriangle size={32} />
                    <p className="text-lg font-bold">Please enter working hours</p>
                  </div>
                ) : (
                  <>
                    <div className="text-7xl font-bold text-[#6C47FF]">₹{weeklyEarnings}</div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Smart AI Insight:</p>
                      <p className="text-xs font-bold text-[#22C55E]">{getInsight()}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1 border-l-2 border-[#6C47FF]/20 pl-4 py-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Calculation Formula</p>
                <p className="text-[10px] text-gray-500 italic">Final Rate = Base Rate × Time Multiplier</p>
                <p className="text-[10px] font-bold text-[#1A1A2E]">Standard Base Rate = ₹60/hr</p>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed max-w-[320px]">
                Derived from your Income DNA earning pattern across {totalHours * 7} projected working hours per week.
              </p>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter mb-1">RECOMMENDED PLAN</p>
                <p className="text-xl font-bold text-[#F59E0B]">Pro Shield</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  onClick={handleRazorpay}
                  disabled={totalHours === 0}
                  className="flex-1 bg-[#6C47FF] text-white font-bold rounded-xl px-8 h-12 transition-all text-sm shadow-btn hover:bg-[#5535E8]"
                >
                  View Payout <IndianRupee size={14} className="ml-2" />
                </Button>
                <Button variant="outline" className="border-2 border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#6C47FF] hover:text-white rounded-xl px-8 h-12 transition-all text-sm">
                  Upgrade Plan
                </Button>
              </div>
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
