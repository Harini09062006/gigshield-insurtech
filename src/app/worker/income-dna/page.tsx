
"use client";

import React, { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  BarChart,
  Bar,
  Cell
} from "recharts";
import { 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon,
  ChevronRight
} from "lucide-react";

/**
 * Pixel-Perfect Fintech Income DNA Dashboard
 * Strict adherence to soft SaaS design principles.
 */
export default function IncomeDNADashboard() {
  const [baseRate] = useState(60);

  // Time Slot Logic
  const timeSlots = useMemo(() => [
    { id: "morning", title: "MORNING", range: "6am - 10am", multiplier: 0.75, icon: Sunrise },
    { id: "afternoon", title: "AFTERNOON", range: "12pm - 4pm", multiplier: 0.95, icon: Sun },
    { id: "evening", title: "EVENING", range: "5pm - 9pm", multiplier: 1.30, icon: Sunset },
    { id: "night", title: "NIGHT", range: "9pm - 12am", multiplier: 0.85, icon: Moon },
  ], []);

  const slotData = useMemo(() => {
    return timeSlots.map(slot => ({
      ...slot,
      hourlyRate: Math.round(baseRate * slot.multiplier),
      progress: slot.multiplier * 70 // Visual progress bar %
    }));
  }, [baseRate, timeSlots]);

  // Expected Weekly Calculation
  const weeklyEarnings = useMemo(() => {
    // Formula: (M*4 + A*4 + E*4 + N*3) * 7
    const daily = (slotData[0].hourlyRate * 4) + 
                  (slotData[1].hourlyRate * 4) + 
                  (slotData[2].hourlyRate * 4) + 
                  (slotData[3].hourlyRate * 3);
    return daily * 7;
  }, [slotData]);

  // Chart Data: 24-Hour Cycle
  const areaChartData = useMemo(() => {
    const hours = ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];
    const values = [40, 30, 25, 45, 55, 50, 60, 65, 75, 95, 85, 55];
    return hours.map((h, i) => ({ time: h, earnings: values[i] }));
  }, []);

  // Weekly Bar Data
  const barChartData = [
    { day: 'Mon', value: 600 },
    { day: 'Tue', value: 580 },
    { day: 'Wed', value: 620 },
    { day: 'Thu', value: 650 },
    { day: 'Fri', value: 850 },
    { day: 'Sat', value: 1100 },
    { day: 'Sun', value: 950 },
  ];

  return (
    <div className="min-h-screen bg-[#eef0f7] p-6 lg:p-10 font-body text-[#1A1A2E]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Expected Weekly Earnings Card */}
          <Card className="border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] flex flex-col justify-between p-8">
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-4">Expected Weekly Earnings</p>
              <h2 className="text-[56px] font-black text-[#6d28d9] leading-none mb-4">₹{weeklyEarnings.toLocaleString()}</h2>
              <p className="text-sm text-[#94A3B8] font-medium max-w-sm">
                Calculated based on your historical work consistency and platform demand multipliers.
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-8 border-t border-[#f1f5f9]">
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-1">Status</p>
                <p className="text-sm font-bold text-[#22c55e]">High Consistency</p>
              </div>
              <Button variant="outline" className="border-[#6d28d9] text-[#6d28d9] rounded-xl font-bold px-6 hover:bg-[#6d28d9] hover:text-white transition-all">
                View DNA Details
              </Button>
            </div>
          </Card>

          {/* 2x2 Grid of Time Cards */}
          <div className="grid grid-cols-2 gap-6">
            {slotData.map((slot) => (
              <Card key={slot.id} className="border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#6d28d9]">
                      <slot.icon size={18} />
                    </div>
                    <span className="text-[9px] font-black text-[#94A3B8] tracking-widest">{slot.title}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#94A3B8] mb-0.5">{slot.range}</p>
                    <p className="text-xl font-black">₹{slot.hourlyRate}<span className="text-xs text-[#94A3B8] ml-1">/hr</span></p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-1 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#6d28d9] transition-all duration-1000" 
                      style={{ width: `${slot.progress}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* BOTTOM SECTION: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Peak Earning Hours Chart */}
          <Card className="border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#94A3B8]">Peak Earning Hours</h3>
              <div className="px-3 py-1 bg-[#f1f5f9] rounded-full text-[9px] font-black text-[#6d28d9] tracking-wider uppercase">24-Hour Profile</div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                    interval={1}
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
                    cursor={{ stroke: '#6d28d9', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#6d28d9" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEarnings)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Best Working Days Chart */}
          <Card className="border-none rounded-[20px] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.05)] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#94A3B8]">Best Working Days</h3>
              <div className="px-3 py-1 bg-[#f1f5f9] rounded-full text-[9px] font-black text-[#6d28d9] tracking-wider uppercase">Weekly Intensity</div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
                    {barChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index >= 5 ? '#f59e0b' : '#6d28d9'} 
                      />
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
