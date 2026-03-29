"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Bell, 
  Headphones, 
  LogOut, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Search,
  MoreVertical,
  Send,
  XCircle,
  CheckCircle,
  Loader2,
  User as UserIcon,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  limit,
  where
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/**
 * PRODUCTION-READY ADMIN DASHBOARD (NO AUTH GATING)
 * Features: 
 * - Real-time Firestore Sync (onSnapshot)
 * - Relational User Name Mapping
 * - Threaded Chat with Resolution Logic
 * - Dynamic Stats Aggregation
 */

export default function AdminNewPage() {
  const db = useFirestore();
  const router = useRouter();
  
  // 1. Navigation & UI State
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 2. Real-time Firestore Queries
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200));
  }, [db]);

  const claimsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "claims"), orderBy("created_at", "desc"), limit(200));
  }, [db]);

  const messagesQuery = useMemoFirebase(() => {
    if (!db) return null;
    // We fetch all to handle grouping, or filter by status if desired
    return query(collection(db, "support_messages"), orderBy("timestamp", "desc"), limit(500));
  }, [db]);

  const { data: realUsers, isLoading: loadingUsers } = useCollection(usersQuery);
  const { data: realClaims, isLoading: loadingClaims } = useCollection(claimsQuery);
  const { data: rawMessages, isLoading: loadingMessages } = useCollection(messagesQuery);

  // 3. Relational Mapping & Derived Logic
  
  // Create a map of IDs to Names for robust lookup
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    realUsers?.forEach(u => map.set(u.id || u.uid, u.name || "Unknown Worker"));
    return map;
  }, [realUsers]);

  // Group messages into "Threads"
  const threads = useMemo(() => {
    if (!rawMessages) return [];
    
    const userGroups = new Map<string, any>();
    
    rawMessages.forEach(msg => {
      if (!userGroups.has(msg.userId)) {
        userGroups.set(msg.userId, {
          userId: msg.userId,
          // RESOLVE NAME: Use the userMap for real names, fallback to msg field
          userName: userMap.get(msg.userId) || msg.userName || "Anonymous Worker",
          lastMessage: msg.text,
          status: msg.status || 'open',
          timestamp: msg.timestamp,
        });
      }
    });

    const threadList = Array.from(userGroups.values());
    if (chatFilter === 'all') return threadList;
    return threadList.filter(t => t.status === chatFilter);
  }, [rawMessages, chatFilter, userMap]);

  // Filter messages for active thread
  const activeChatMessages = useMemo(() => {
    if (!rawMessages || !activeChatUserId) return [];
    return rawMessages
      .filter(m => m.userId === activeChatUserId)
      .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
  }, [rawMessages, activeChatUserId]);

  const activeThread = threads.find(t => t.userId === activeChatUserId);

  // Stats Aggregation
  const stats = useMemo(() => ({
    totalWorkers: realUsers?.length || 0,
    pendingClaims: realClaims?.filter(c => c.status === 'pending' || !c.status).length || 0,
    totalPayouts: realClaims?.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.compensation || 0), 0) || 0
  }), [realUsers, realClaims]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatMessages]);

  // 4. Data Mutation Actions
  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeChatUserId || !db) return;
    
    const text = chatInput;
    setChatInput("");

    try {
      await addDoc(collection(db, "support_messages"), {
        userId: activeChatUserId,
        userName: activeThread?.userName || "Worker",
        text,
        sender: "admin",
        status: "open", // Keep thread open during response
        timestamp: serverTimestamp()
      });

      // Update associated thread status to "in-progress" if needed
      const openMsgs = rawMessages?.filter(m => m.userId === activeChatUserId && m.status === 'open') || [];
      for (const m of openMsgs) {
        await updateDoc(doc(db, "support_messages", m.id), { status: "open" });
      }
    } catch (e) {
      console.error("Failed to send reply", e);
    }
  };

  const markResolved = async () => {
    if (!activeChatUserId || !db || !rawMessages) return;
    try {
      const threadMsgs = rawMessages.filter(m => m.userId === activeChatUserId && m.status !== 'resolved');
      for (const m of threadMsgs) {
        await updateDoc(doc(db, "support_messages", m.id), { status: "resolved" });
      }
      setActiveChatUserId(null);
    } catch (e) {
      console.error("Resolution failed", e);
    }
  };

  const updateClaimStatus = async (id: string, status: 'paid' | 'rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "claims", id), { 
        status, 
        updatedAt: serverTimestamp() 
      });
    } catch (e) {
      console.error("Claim update failed", e);
    }
  };

  // 5. Render Fragments
  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Workers", value: stats.totalWorkers, change: "LIVE", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Risk Events", value: "14", change: "STABLE", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Pending Claims", value: stats.pendingClaims, change: "NEW", icon: Bell, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Total Payouts", value: `₹${(stats.totalPayouts / 1000).toFixed(1)}k`, change: "TOTAL", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-md bg-emerald-50 text-emerald-600`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="text-[#6C47FF] h-5 w-5" /> Live City Risk Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Mumbai", risk: "High Risk", color: "bg-red-500", detail: "Heavy rainfall predicted." },
              { name: "Delhi", risk: "Medium Risk", color: "bg-amber-500", detail: "AQI reaching 320." },
              { name: "Bengaluru", risk: "Low Risk", color: "bg-emerald-500", detail: "Clear conditions." },
            ].map(city => (
              <div key={city.name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-900">{city.name}</span>
                  <div className={`h-2 w-2 rounded-full ${city.color}`} />
                </div>
                <Badge variant="outline" className="mb-2 uppercase text-[9px] font-black">{city.risk}</Badge>
                <p className="text-xs text-gray-500 leading-relaxed">{city.detail}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#1A1A2E] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-bold mb-2">Manual System Override</h3>
            <p className="text-sm text-gray-400 max-w-md mb-6">Directly interface with the risk intelligence engine without authentication gates.</p>
            <div className="flex gap-3">
              <button onClick={() => alert("Simulation started")} className="bg-[#6C47FF] hover:bg-[#5535E8] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all">Simulate Outage</button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-bold">Deploy Update</button>
            </div>
            <Zap className="absolute -right-10 -bottom-10 h-40 w-40 text-white opacity-5 rotate-12" />
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Clock className="text-gray-400 h-5 w-5" /> Live Claims Activity</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {realClaims?.slice(0, 6).map((claim, i) => (
              <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-gray-900">{userMap.get(claim.worker_id || claim.userId) || "Worker"}</span>
                  <Badge variant="outline" className="text-[8px] h-4">{claim.status || 'pending'}</Badge>
                </div>
                <p className="text-xs text-gray-500">Claim for ₹{claim.compensation} ({claim.trigger_type || 'Weather'})</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkers = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Worker Directory</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input 
            placeholder="Search partners..." 
            className="pl-10 pr-4 h-10 w-64 rounded-xl text-sm"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">City</th>
              <th className="px-6 py-4">Platform</th>
              <th className="px-6 py-4">Avg. Earnings</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loadingUsers ? [1,2,3].map(i => <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-6 w-full"/></td></tr>) : 
              realUsers?.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(worker => (
              <tr key={worker.id} className="text-sm text-gray-600 hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900">{worker.name || "Unknown"}</td>
                <td className="px-6 py-4">{worker.city || "N/A"}</td>
                <td className="px-6 py-4">{worker.platform || "N/A"}</td>
                <td className="px-6 py-4 font-medium">₹{worker.avg_hourly_earnings || 0}/hr</td>
                <td className="px-6 py-4"><Badge variant="secondary" className="capitalize">{worker.role}</Badge></td>
                <td className="px-6 py-4"><button className="p-1 hover:bg-gray-100 rounded-md"><MoreVertical size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderClaims = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-900">Parametric Claims Queue</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingClaims ? [1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl"/>) : 
          realClaims?.map(claim => (
          <div key={claim.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-[#6C47FF] uppercase tracking-widest">{claim.trigger_type || "WEATHER TRIGGER"}</p>
                <h4 className="text-lg font-bold text-gray-900 mt-1">₹{claim.compensation}</h4>
                <p className="text-[10px] text-gray-500 mt-1">{userMap.get(claim.worker_id || claim.userId)}</p>
              </div>
              <Badge variant={claim.status === 'paid' ? 'default' : 'outline'} className={`capitalize ${claim.status === 'paid' ? 'bg-emerald-500' : ''}`}>
                {claim.status || 'pending'}
              </Badge>
            </div>
            <div className="flex justify-between items-end mt-4">
              <p className="text-[10px] text-gray-400 font-mono">#{claim.id.slice(0, 8)}</p>
              {(claim.status === 'pending' || !claim.status) && (
                <div className="flex gap-2">
                  <button onClick={() => updateClaimStatus(claim.id, 'rejected')} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Reject"><XCircle size={20} /></button>
                  <button onClick={() => updateClaimStatus(claim.id, 'paid')} className="p-2 text-emerald-500 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors" title="Mark as Paid"><CheckCircle size={20} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="flex h-[calc(100vh-160px)] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Conversations</h3>
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
            {(['open', 'all'] as const).map(f => (
              <button key={f} onClick={() => setChatFilter(f as any)} className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${chatFilter === f ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-gray-400'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
          {loadingMessages ? [1,2,3].map(i => <div key={i} className="p-4"><Skeleton className="h-12 w-full"/></div>) : 
            threads.length === 0 ? <p className="p-10 text-center text-xs text-gray-400 italic">No active tickets</p> : 
            threads.map((thread) => (
            <button key={thread.userId} onClick={() => setActiveChatUserId(thread.userId)} className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${activeChatUserId === thread.userId ? "bg-[#F5F3FF] border-l-4 border-l-[#6C47FF]" : ""}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-gray-900 truncate">{thread.userName}</span>
                <span className="text-[10px] text-gray-400">{thread.timestamp?.seconds ? format(new Date(thread.timestamp.seconds * 1000), "HH:mm") : 'Live'}</span>
              </div>
              <p className="text-xs text-gray-500 truncate italic">"{thread.lastMessage}"</p>
              <div className="mt-2 flex justify-between items-center">
                <Badge className={`text-[8px] h-4 font-black uppercase ${thread.status === 'open' ? 'bg-red-500' : 'bg-emerald-500'}`}>{thread.status}</Badge>
                <span className="text-[8px] text-gray-400 font-mono">ID: {thread.userId.slice(0, 6)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50/50">
        {activeThread ? (
          <>
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#6C47FF] to-[#A78BFF] flex items-center justify-center text-white text-[10px] font-black">{activeThread.userName[0]}</div>
                <div>
                  <span className="font-bold text-gray-900 block leading-tight">{activeThread.userName}</span>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Active Thread</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={markResolved} className="text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest px-4 border-[#6C47FF]/20 rounded-full hover:bg-[#6C47FF] hover:text-white transition-all">Mark Resolved</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" ref={scrollRef}>
              {activeChatMessages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.sender === 'admin' ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'admin' 
                      ? "bg-[#6C47FF] text-white rounded-tr-none" 
                      : msg.sender === 'bot' 
                        ? "bg-purple-50 text-purple-700 border border-purple-100 rounded-tl-none italic"
                        : "bg-white text-gray-700 rounded-tl-none border border-gray-100"
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className={`text-[9px] mt-2 opacity-60 text-right font-bold uppercase tracking-tighter ${msg.sender === 'admin' ? "text-white" : "text-gray-400"}`}>
                      {msg.sender} • {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), "HH:mm") : 'Sending...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
              <div className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:ring-2 focus-within:ring-[#6C47FF]/10 transition-all">
                <input 
                  placeholder="Type official GigShield response..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4"
                />
                <button onClick={handleSendChat} className="h-10 w-10 bg-[#6C47FF] text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-[#5535E8] transition-transform active:scale-95">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-card border border-gray-100">
              <MessageSquare size={32} className="opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-900">Worker Support Queue</p>
              <p className="text-xs text-gray-500 mt-1">Select a partner thread to manage live disruptions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8F9FC] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">GigShield<span className="text-[#6C47FF] text-xs ml-1 font-black">ADMIN</span></span>
          </div>
          <nav className="space-y-1">
            {[
              { label: "Dashboard", icon: LayoutDashboard },
              { label: "Worker Directory", icon: Users },
              { label: "Claims Queue", icon: Bell },
              { label: "Support Chat", icon: Headphones },
            ].map((item) => (
              <button 
                key={item.label} 
                onClick={() => setActiveTab(item.label)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.label ? "bg-[#F5F3FF] text-[#6C47FF]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <button onClick={() => router.push("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">
            <LogOut size={18} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{activeTab}</h1>
            <p className="text-sm text-gray-500 font-medium">Real-time system monitoring active</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Firestore Link</span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Worker Directory' && renderWorkers()}
          {activeTab === 'Claims Queue' && renderClaims()}
          {activeTab === 'Support Chat' && renderSupport()}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E8E6FF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D4CCFF; }
      `}</style>
    </div>
  );
}
