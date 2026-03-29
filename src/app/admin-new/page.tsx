"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  MessageSquare,
  Filter,
  CheckCircle2,
  MapPin,
  ShieldAlert
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
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AdminNewPage() {
  const db = useFirestore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [claimStatusFilter, setStatusFilter] = useState<'all' | 'approved' | 'review' | 'failed'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const usersQuery = useMemoFirebase(() => db ? query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200)) : null, [db]);
  const claimsQuery = useMemoFirebase(() => db ? query(collection(db, "claims"), orderBy("created_at", "desc"), limit(500)) : null, [db]);
  const messagesQuery = useMemoFirebase(() => db ? query(collection(db, "support_messages"), orderBy("timestamp", "desc"), limit(500)) : null, [db]);

  const { data: realUsers, isLoading: loadingUsers } = useCollection(usersQuery);
  const { data: realClaims, isLoading: loadingClaims } = useCollection(claimsQuery);
  const { data: rawMessages, isLoading: loadingMessages } = useCollection(messagesQuery);

  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    realUsers?.forEach(u => map.set(u.id || u.uid, u));
    return map;
  }, [realUsers]);

  const threads = useMemo(() => {
    if (!rawMessages) return [];
    const userGroups = new Map<string, any>();
    rawMessages.forEach(msg => {
      if (!userGroups.has(msg.userId)) {
        userGroups.set(msg.userId, {
          userId: msg.userId,
          userName: userMap.get(msg.userId)?.name || msg.userName || "Worker",
          lastMessage: msg.text,
          status: msg.status || 'open',
          timestamp: msg.timestamp,
        });
      }
    });
    const list = Array.from(userGroups.values());
    return chatFilter === 'all' ? list : list.filter(t => t.status === chatFilter);
  }, [rawMessages, chatFilter, userMap]);

  const filteredClaims = useMemo(() => {
    if (!realClaims) return [];
    if (claimStatusFilter === 'all') return realClaims;
    return realClaims.filter(c => c.status === claimStatusFilter);
  }, [realClaims, claimStatusFilter]);

  const activeChatMessages = useMemo(() => {
    if (!rawMessages || !activeChatUserId) return [];
    return rawMessages
      .filter(m => m.userId === activeChatUserId)
      .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
  }, [rawMessages, activeChatUserId]);

  const stats = useMemo(() => ({
    totalWorkers: realUsers?.length || 0,
    pendingClaims: realClaims?.filter(c => c.status === 'review').length || 0,
    fraudAlerts: realClaims?.filter(c => c.status === 'failed').length || 0,
    totalPayouts: realClaims?.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.compensation || 0), 0) || 0
  }), [realUsers, realClaims]);

  const updateClaim = async (id: string, status: string, decision: string, reason: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "claims", id), { 
        status, 
        decision, 
        reason: "Manual Admin Action: " + reason,
        updatedAt: serverTimestamp() 
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Workers", value: stats.totalWorkers, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Fraud Alerts", value: stats.fraudAlerts, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
          { label: "Review Required", value: stats.pendingClaims, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Total Payouts", value: `₹${(stats.totalPayouts / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={20} /></div>
              <span className="text-[10px] font-black px-2 py-1 rounded-md bg-gray-50 text-gray-400">LIVE</span>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield className="text-[#6C47FF] h-5 w-5" /> Fraud Decision Center</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">High Risk Claims Queue</h3>
              <div className="flex gap-2">
                {['all', 'failed', 'review', 'approved'].map(f => (
                  <button key={f} onClick={() => setStatusFilter(f as any)} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${claimStatusFilter === f ? 'bg-[#6C47FF] text-white' : 'bg-gray-100 text-gray-400'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {loadingClaims ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-gray-300" /></div> : 
                filteredClaims.slice(0, 10).map(claim => (
                <div key={claim.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${claim.status === 'failed' ? 'bg-red-50 text-red-500' : claim.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                      {claim.status === 'failed' ? <ShieldAlert size={20} /> : claim.status === 'approved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{userMap.get(claim.worker_id)?.name || "Unknown Worker"}</p>
                      <p className="text-[10px] text-gray-400">Score: {claim.trustScore}/100 • {claim.gps_verification} GPS • ₹{claim.compensation}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {claim.status !== 'approved' && (
                      <Button size="sm" variant="ghost" onClick={() => updateClaim(claim.id, 'approved', 'APPROVED', 'Admin Override')} className="text-emerald-600 hover:bg-emerald-50 h-8 font-bold text-[10px]">APPROVE</Button>
                    )}
                    {claim.status !== 'failed' && (
                      <Button size="sm" variant="ghost" onClick={() => updateClaim(claim.id, 'failed', 'BLOCKED', 'Admin Rejection')} className="text-red-600 hover:bg-red-50 h-8 font-bold text-[10px]">REJECT</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Zap className="text-amber-500 h-5 w-5" /> Risk Analytics</h2>
          <div className="bg-[#1A1A2E] text-white p-6 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global Risk Index</p>
              <div className="text-4xl font-black">42.8 <span className="text-emerald-400 text-sm font-bold tracking-normal">STABLE</span></div>
            </div>
            <div className="space-y-4">
              {['Mumbai', 'Delhi', 'Bengaluru'].map(city => (
                <div key={city} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                  <span className="text-xs font-bold">{city}</span>
                  <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6C47FF]" style={{ width: '65%' }} />
                  </div>
                </div>
              ))}
            </div>
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
          <Input placeholder="Search partners..." className="pl-10 pr-4 h-10 w-64 rounded-xl text-sm" onChange={(e) => setSearchQuery(e.target.value)} />
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

  return (
    <div className="flex h-screen w-full bg-[#F8F9FC] font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-lg"><Shield className="text-white h-6 w-6" /></div>
            <span className="text-xl font-bold text-gray-900">GigShield<span className="text-[#6C47FF] text-xs ml-1 font-black">ADMIN</span></span>
          </div>
          <nav className="space-y-1">
            {[
              { label: "Dashboard", icon: LayoutDashboard },
              { label: "Worker Directory", icon: Users },
              { label: "Support Chat", icon: Headphones },
            ].map((item) => (
              <button key={item.label} onClick={() => setActiveTab(item.label)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.label ? "bg-[#F5F3FF] text-[#6C47FF]" : "text-gray-500 hover:bg-gray-50"}`}>
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <button onClick={() => router.push("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"><LogOut size={18} /> Exit Admin</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{activeTab}</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Risk Intelligence Active</span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Worker Directory' && renderWorkers()}
        </div>
      </main>
    </div>
  );
}
