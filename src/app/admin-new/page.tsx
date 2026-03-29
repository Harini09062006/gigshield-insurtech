"use client";

import React from "react";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Bell, 
  Headphones, 
  LogOut, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  MapPin,
  Clock
} from "lucide-react";

/**
 * NEW ADMIN DASHBOARD PROTOTYPE
 * Path: /admin-new
 * Features: Pure UI, No Auth logic, Responsive Sidebar Layout
 */

export default function AdminNewPage() {
  const stats = [
    { label: "Total Workers", value: "12,482", change: "+12%", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Risk Events", value: "14", change: "-2", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Pending Claims", value: "84", change: "5 new", icon: Bell, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Total Payouts", value: "₹4.2L", change: "+18%", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  const cityRisks = [
    { name: "Mumbai", risk: "High Risk", level: "high", color: "bg-red-500", detail: "Heavy rainfall predicted in South Mumbai (45mm)" },
    { name: "Delhi", risk: "Medium Risk", level: "medium", color: "bg-amber-500", detail: "AQI reaching 320. Moderate disruption expected." },
    { name: "Bengaluru", risk: "Low Risk", level: "low", color: "bg-emerald-500", detail: "Clear conditions. Standard delivery operations." },
  ];

  const activities = [
    { user: "Ravi Kumar", action: "Claim Filed", time: "2 mins ago", status: "Pending" },
    { user: "System", action: "Mumbai Risk Update", time: "15 mins ago", status: "Auto" },
    { user: "Admin", action: "Policy Updated", time: "1 hour ago", status: "Manual" },
    { user: "Sonia Singh", action: "Support Query", time: "3 hours ago", status: "Open" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8F9FC] font-sans">
      {/* FIXED SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">GigShield<span className="text-[#6C47FF] text-xs ml-1 font-black">PRO</span></span>
          </div>

          <nav className="space-y-1">
            {[
              { label: "Dashboard", icon: LayoutDashboard, active: true },
              { label: "Worker Management", icon: Users },
              { label: "Claims Queue", icon: Bell },
              { label: "Support Chat", icon: Headphones },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  item.active 
                    ? "bg-[#F5F3FF] text-[#6C47FF]" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Command Center</h1>
            <p className="text-sm text-gray-500 font-medium">Real-time system health and risk monitoring</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Active</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shadow-sm">
              AD
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    stat.change.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 bg-gray-50'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CITY RISK SECTION */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="text-[#6C47FF] h-5 w-5" />
                  Live City Risk Intelligence
                </h2>
                <button className="text-sm font-bold text-[#6C47FF] hover:underline">View Heatmap</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cityRisks.map((city) => (
                  <div key={city.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900">{city.name}</span>
                        <div className={`h-2 w-2 rounded-full ${city.color}`} />
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-wider mb-2 px-2 py-0.5 rounded inline-block ${
                        city.level === 'high' ? 'bg-red-50 text-red-600' : 
                        city.level === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {city.risk}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mt-2">{city.detail}</p>
                    </div>
                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                      <button className="text-[10px] font-bold text-gray-400 uppercase hover:text-[#6C47FF] transition-colors">Alert Settings →</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* OVERRIDE PANEL */}
              <div className="bg-[#1A1A2E] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">Manual System Override</h3>
                  <p className="text-sm text-gray-400 max-w-md mb-6">Force trigger city-wide disruption events for maintenance or emergency testing purposes.</p>
                  <div className="flex gap-3">
                    <button className="bg-[#6C47FF] hover:bg-[#5535E8] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">
                      Simulate Outage
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all">
                      Deploy Update
                    </button>
                  </div>
                </div>
                <Zap className="absolute -right-10 -bottom-10 h-40 w-40 text-white opacity-5 rotate-12" />
              </div>
            </div>

            {/* RECENT ACTIVITY PANEL */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="text-gray-400 h-5 w-5" />
                Live Feed
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {activities.map((act, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-gray-900">{act.user}</span>
                      <span className="text-[10px] font-medium text-gray-400">{act.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">{act.action}</p>
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                        act.status === 'Pending' ? 'text-amber-600 bg-amber-50' : 
                        act.status === 'Auto' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-100'
                      }`}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))}
                <button className="w-full p-4 text-center text-xs font-bold text-[#6C47FF] hover:bg-gray-50 transition-colors">
                  View System Logs
                </button>
              </div>

              {/* OVERVIEW TIP */}
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                <div className="flex gap-3">
                  <CheckCircle2 className="text-blue-500 h-5 w-5 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    <b>Tip:</b> High risk zones in Mumbai are currently under 1.3x DNA payout multipliers due to monsoon alerts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
