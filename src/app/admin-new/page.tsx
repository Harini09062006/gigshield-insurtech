"use client";

import React, { useState, useEffect } from "react";
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
  Clock,
  Search,
  MoreVertical,
  Send,
  XCircle,
  CheckCircle,
  Filter
} from "lucide-react";

/**
 * INTERACTIVE ADMIN DASHBOARD PROTOTYPE
 * Features: React State Navigation, Functional Simulation, Mock Data Tables
 */

export default function AdminNewPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Mock Data State
  const [stats, setStats] = useState([
    { label: "Total Workers", value: "12,482", change: "+12%", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Risk Events", value: "14", change: "-2", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Pending Claims", value: "84", change: "5 new", icon: Bell, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Total Payouts", value: "₹4.2L", change: "+18%", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
  ]);

  const [cityRisks, setCityRisks] = useState([
    { name: "Mumbai", risk: "High Risk", level: "high", color: "bg-red-500", detail: "Heavy rainfall predicted in South Mumbai (45mm)" },
    { name: "Delhi", risk: "Medium Risk", level: "medium", color: "bg-amber-500", detail: "AQI reaching 320. Moderate disruption expected." },
    { name: "Bengaluru", risk: "Low Risk", level: "low", color: "bg-emerald-500", detail: "Clear conditions. Standard delivery operations." },
  ]);

  const [activities, setActivities] = useState([
    { user: "Ravi Kumar", action: "Claim Filed", time: "2 mins ago", status: "Pending" },
    { user: "System", action: "Mumbai Risk Update", time: "15 mins ago", status: "Auto" },
    { user: "Admin", action: "Policy Updated", time: "1 hour ago", status: "Manual" },
    { user: "Sonia Singh", action: "Support Query", time: "3 hours ago", status: "Open" },
  ]);

  const [workers, setWorkers] = useState([
    { id: "W-102", name: "Ravi Kumar", phone: "+91 98234 56781", platform: "Zomato", city: "Mumbai", earnings: "₹850/day", status: "Active" },
    { id: "W-105", name: "Sonia Singh", phone: "+91 91234 56782", platform: "Swiggy", city: "Delhi", earnings: "₹720/day", status: "On Break" },
    { id: "W-109", name: "Amit Patel", phone: "+91 93234 56783", platform: "Blinkit", city: "Mumbai", earnings: "₹910/day", status: "Active" },
    { id: "W-112", name: "Priya Das", phone: "+91 94234 56784", platform: "Uber Eats", city: "Bengaluru", earnings: "₹640/day", status: "Offline" },
  ]);

  const [claims, setClaims] = useState([
    { id: "C-901", user: "Ravi Kumar", amount: "₹240", type: "Rain Disruption", status: "Pending" },
    { id: "C-902", user: "Amit Patel", amount: "₹180", type: "Flood Warning", status: "Approved" },
    { id: "C-903", user: "Sonia Singh", amount: "₹320", type: "AQI Hazard", status: "Pending" },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, sender: "worker", text: "My claim #C-901 is still pending. Can you check?", time: "10:15 AM" },
    { id: 2, sender: "admin", text: "Hi Ravi, I'm checking it now. One moment.", time: "10:16 AM" },
    { id: 3, sender: "worker", text: "Thank you!", time: "10:17 AM" },
  ]);

  // 2. Interactive Functions
  const addActivity = (user: string, action: string, status: string = "Manual") => {
    setActivities(prev => [{ user, action, time: "Just now", status }, ...prev.slice(0, 5)]);
  };

  const simulateOutage = () => {
    setCityRisks(prev => prev.map(c => c.name === "Mumbai" ? { ...c, risk: "CRITICAL", level: "high", detail: "Emergency Alert: Network Outage Detected" } : c));
    addActivity("Admin", "Triggered Mumbai Outage", "Urgent");
    alert("Outage Simulation Triggered for Mumbai");
  };

  const deployUpdate = () => {
    addActivity("Admin", "System Update v2.4", "Auto");
    alert("System update successfully deployed to all zones.");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg = { id: Date.now(), sender: "admin", text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setChatInput("");
    addActivity("Admin", "Replied to Ravi Kumar", "Chat");
  };

  const updateClaimStatus = (id: string, status: string) => {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    addActivity("Admin", `Claim ${id} ${status}`, status === 'Approved' ? 'Success' : 'Danger');
  };

  // 3. Navigation Components
  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
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
            <button onClick={() => alert("Heatmap View is coming soon!")} className="text-sm font-bold text-[#6C47FF] hover:underline">View Heatmap</button>
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
                <button 
                  onClick={simulateOutage}
                  className="bg-[#6C47FF] hover:bg-[#5535E8] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                >
                  Simulate Outage
                </button>
                <button 
                  onClick={deployUpdate}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                >
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
                    act.status === 'Auto' ? 'text-blue-600 bg-blue-50' : 
                    act.status === 'Chat' ? 'text-[#6C47FF] bg-purple-50' : 'text-gray-500 bg-gray-100'
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
        </div>
      </div>
    </div>
  );

  const renderWorkers = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Worker Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search name or ID..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6C47FF]/20 outline-none"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="px-6 py-4">Worker ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">City</th>
              <th className="px-6 py-4">Platform</th>
              <th className="px-6 py-4">Earnings</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase())).map(worker => (
              <tr key={worker.id} className="text-sm text-gray-600 hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs">{worker.id}</td>
                <td className="px-6 py-4 font-bold text-gray-900">{worker.name}</td>
                <td className="px-6 py-4">{worker.city}</td>
                <td className="px-6 py-4">{worker.platform}</td>
                <td className="px-6 py-4 font-medium">{worker.earnings}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    worker.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {worker.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-1 hover:bg-white rounded-md transition-colors"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderClaims = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Claims Queue</h2>
        <button className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-xl">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {claims.map(claim => (
          <div key={claim.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-[#6C47FF] uppercase tracking-widest">{claim.type}</p>
                <h4 className="text-lg font-bold text-gray-900 mt-1">{claim.user}</h4>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                claim.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {claim.status}
              </span>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-400">Compensation</p>
                <p className="text-2xl font-black text-gray-900">{claim.amount}</p>
              </div>
              {claim.status === 'Pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateClaimStatus(claim.id, 'Rejected')}
                    className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                  <button 
                    onClick={() => updateClaimStatus(claim.id, 'Approved')}
                    className="p-2 text-emerald-500 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-4 border-t border-gray-50 pt-2 font-mono">ID: {claim.id}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="flex h-[calc(100vh-160px)] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
      {/* CONVERSATION LIST */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Active Chats</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {[
            { name: "Ravi Kumar", last: "Check claim #C-901", active: true },
            { name: "Sonia Singh", last: "Renewal failed", active: false },
            { name: "Amit Patel", last: "Thank you for the update", active: false },
          ].map((chat, i) => (
            <button key={i} className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${chat.active ? "bg-[#F5F3FF]" : ""}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-gray-900">{chat.name}</span>
                <span className="text-[10px] text-gray-400">10:15 AM</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{chat.last}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#6C47FF] flex items-center justify-center text-white text-[10px] font-black">RK</div>
            <span className="font-bold text-gray-900">Ravi Kumar</span>
          </div>
          <button className="text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest px-3 py-1 bg-[#F5F3FF] rounded-full">In Progress</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'admin' ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                msg.sender === 'admin' ? "bg-[#6C47FF] text-white rounded-tr-none" : "bg-white text-gray-700 rounded-tl-none"
              }`}>
                {msg.text}
                <p className={`text-[9px] mt-1 opacity-60 text-right ${msg.sender === 'admin' ? "text-white" : "text-gray-400"}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <div className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <input 
              type="text" 
              placeholder="Type your reply..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4"
            />
            <button 
              onClick={handleSendChat}
              className="h-10 w-10 bg-[#6C47FF] text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-[#5535E8] transition-transform active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
              { label: "Dashboard", icon: LayoutDashboard },
              { label: "Worker Management", icon: Users },
              { label: "Claims Queue", icon: Bell },
              { label: "Support Chat", icon: Headphones },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.label 
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
          <button 
            onClick={() => { console.log("Sign out clicked"); alert("Logging out..."); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
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
            <h1 className="text-2xl font-bold text-gray-900">{activeTab}</h1>
            <p className="text-sm text-gray-500 font-medium">
              {activeTab === 'Dashboard' ? "Real-time system health and risk monitoring" : `Managing ${activeTab.toLowerCase()} system`}
            </p>
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

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Worker Management' && renderWorkers()}
          {activeTab === 'Claims Queue' && renderClaims()}
          {activeTab === 'Support Chat' && renderSupport()}
        </div>
      </main>
    </div>
  );
}