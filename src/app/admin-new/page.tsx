"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  ArrowRight,
  MapPin
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { 
  collection, 
  query, 
  where,
  updateDoc, 
  doc, 
  serverTimestamp, 
  limit,
  addDoc,
  onSnapshot
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
  const { user, isUserLoading } = useUser();
  
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const isAuthReady = !isUserLoading && !!user;

  // Firestore Subscriptions
  const usersQuery = useMemoFirebase(() => {
    if (!db || !isAuthReady) return null;
    return query(collection(db, "users"), limit(100));
  }, [db, isAuthReady]);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !isAuthReady) return null;
    return query(collection(db, "claims"), limit(100));
  }, [db, isAuthReady]);

  // Standardized Chat History Listener
  // Removed orderBy to prevent Missing Index error
  const chatsQuery = useMemoFirebase(() => {
    if (!db || !isAuthReady) return null;
    return query(
      collection(db, "chats"), 
      limit(1000)
    );
  }, [db, isAuthReady]);

  const { data: rawUsers, isLoading: loadingUsers } = useCollection(usersQuery);
  const { data: rawClaims, isLoading: loadingClaims } = useCollection(claimsQuery);
  const { data: rawMessages, isLoading: loadingMessages } = useCollection(chatsQuery);

  const realUsers = useMemo(() => {
    if (!rawUsers) return [];
    return [...rawUsers].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawUsers]);

  const realClaims = useMemo(() => {
    if (!rawClaims) return [];
    return [...rawClaims].sort((a, b) => {
      const timeA = a.createdAt?.seconds || a.created_at?.seconds || 0;
      const timeB = b.createdAt?.seconds || b.created_at?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawClaims]);

  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    realUsers?.forEach(u => map.set(u.id || u.uid, u));
    return map;
  }, [realUsers]);

  const stats = useMemo(() => ({
    totalWorkers: realUsers?.length || 0,
    riskEvents: realClaims?.filter(c => c.gps_status === 'mismatch').length || 0,
    pendingClaims: realClaims?.filter(c => (c.status === 'review' || c.status === 'pending' || !c.status) && c.gps_status !== 'mismatch').length || 0,
    totalPayouts: realClaims?.filter(c => (c.status === 'approved' || c.status === 'paid') && c.gps_status !== 'mismatch').reduce((sum, c) => sum + (c.compensation || 0), 0) || 0
  }), [realUsers, realClaims]);

  const threads = useMemo(() => {
    if (!rawMessages) return [];
    const groups = new Map<string, any>();
    // Group messages by user, ensuring the latest message status determines thread status
    const sortedMsgs = [...rawMessages].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    
    sortedMsgs.forEach(msg => {
      if (!groups.has(msg.userId)) {
        groups.set(msg.userId, {
          userId: msg.userId,
          userName: userMap.get(msg.userId)?.name || msg.userName || "Worker",
          lastMessage: msg.message || msg.text,
          status: msg.status || 'open',
          timestamp: msg.createdAt,
        });
      }
    });
    return Array.from(groups.values()).filter(t => t.status !== 'resolved' || activeChatUserId === t.userId);
  }, [rawMessages, userMap, activeChatUserId]);

  const activeChatMessages = useMemo(() => {
    if (!rawMessages || !activeChatUserId) return [];
    return rawMessages
      .filter(m => m.userId === activeChatUserId)
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  }, [rawMessages, activeChatUserId]);

  const updateClaimStatus = async (id: string, status: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "claims", id), { 
        status, 
        updatedAt: serverTimestamp() 
      });
    } catch (e) {
      console.error("[Admin] Update claim status failed:", e);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChatUserId || !db) return;
    const text = replyText;
    setReplyText("");
    try {
      // ADMIN REPLY (MANDATORY)
      await addDoc(collection(db, "chats"), {
        userId: activeChatUserId,
        userName: userMap.get(activeChatUserId)?.name || "Worker",
        message: text,
        sender: "admin",
        type: "payment_issue",
        status: "resolved",
        createdAt: serverTimestamp()
      });

      // Update user pending messages to resolved
      const userPendingMsgs = activeChatMessages.filter(m => m.status === 'pending_admin');
      for (const m of userPendingMsgs) {
        await updateDoc(doc(db, "chats", m.id), { status: "resolved" });
      }
    } catch (e) {
      console.error("[Admin] Send reply failed:", e);
    }
  };

  const resolveThread = async () => {
    if (!activeChatUserId || !db || !rawMessages) return;
    const threadMsgs = rawMessages.filter(m => m.userId === activeChatUserId && m.status !== 'resolved');
    const promises = threadMsgs.map(m => updateDoc(doc(db, "chats", m.id), { status: "resolved" }));
    await Promise.all(promises);
    setActiveChatUserId(null);
  };

  const renderDashboard = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Workers", value: stats.totalWorkers, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Location Mismatches", value: stats.riskEvents, icon: MapPin, color: "text-red-500", bg: "bg-red-50" },
          { label: "Pending Claims", value: stats.pendingClaims, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Total Payouts", value: `₹${(stats.totalPayouts / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-[#E8E6FF] shadow-sm">
            <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-[#64748B]">{stat.label}</p>
            <h3 className="text-2xl font-bold text-[#1A1A2E] mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E6FF] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#F5F3FF]">
          <h3 className="font-bold text-[#1A1A2E]">Recent Activity</h3>
        </div>
        <div className="divide-y divide-[#F5F3FF]">
          {realClaims?.slice(0, 5).map(claim => (
            <div key={claim.id} className="p-4 flex items-center justify-between hover:bg-[#F8F9FF] transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#EDE9FF] rounded-lg flex items-center justify-center text-[#6C47FF]">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E]">Claim Submitted</p>
                  <p className="text-xs text-[#64748B]">Worker: {userMap.get(claim.worker_id)?.name || "Unknown"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${claim.gps_status === 'mismatch' ? 'text-red-500' : 'text-[#6C47FF]'}`}>
                  {claim.gps_status === 'mismatch' ? 'DENIED' : `₹${claim.compensation}`}
                </p>
                {claim.gps_status === 'mismatch' && <p className="text-[8px] font-black text-red-500 uppercase">Location Mismatch</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkers = () => (
    <div className="bg-white border border-[#E8E6FF] rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8F9FF] border-b border-[#E8E6FF]">
          <tr className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest">
            <th className="px-6 py-4">Worker</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Platform</th>
            <th className="px-6 py-4">Hourly Rate</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F3FF]">
          {loadingUsers ? [1,2,3].map(i => <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full"/></td></tr>) : 
            realUsers?.map(worker => (
            <tr key={worker.id} className="hover:bg-[#F8F9FF]">
              <td className="px-6 py-4 font-bold text-[#1A1A2E]">{worker.name || "Unknown"}</td>
              <td className="px-6 py-4 text-[#64748B]">{worker.city || "N/A"}</td>
              <td className="px-6 py-4 text-[#64748B]">{worker.platform || "N/A"}</td>
              <td className="px-6 py-4 font-medium text-[#1A1A2E]">₹{worker.avg_hourly_earnings || 0}/hr</td>
              <td className="px-6 py-4"><Badge variant="secondary" className="capitalize bg-[#DCFCE7] text-[#22C55E] border-none font-bold">Active</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderClaims = () => (
    <div className="bg-white border border-[#E8E6FF] rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8F9FF] border-b border-[#E8E6FF]">
          <tr className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest">
            <th className="px-6 py-4">Worker</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">GPS Check</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F3FF]">
          {loadingClaims ? [1,2,3].map(i => <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full"/></td></tr>) : 
            realClaims?.map(claim => (
            <tr key={claim.id} className="hover:bg-[#F8F9FF]">
              <td className="px-6 py-4 font-bold text-[#1A1A2E]">{userMap.get(claim.worker_id)?.name || "Unknown"}</td>
              <td className="px-6 py-4 font-bold text-[#6C47FF]">
                {claim.gps_status === 'mismatch' ? <span className="text-red-500 uppercase font-black">Not Approved</span> : `₹${claim.compensation}`}
              </td>
              <td className="px-6 py-4">
                <Badge variant="outline" className={claim.gps_status === 'matched' ? 'border-[#22C55E] text-[#22C55E]' : 'border-[#EF4444] text-[#EF4444]'}>
                  {claim.gps_status?.toUpperCase() || 'N/A'}
                </Badge>
              </td>
              <td className="px-6 py-4 uppercase text-[10px] font-black">
                {claim.gps_status === 'mismatch' ? <span className="text-red-500 font-black">Not Approved</span> : (claim.status || 'pending')}
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                <Button size="sm" variant="ghost" className="text-[#22C55E]" onClick={() => updateClaimStatus(claim.id, 'approved')}><CheckCircle size={16} /></Button>
                <Button size="sm" variant="ghost" className="text-[#EF4444]" onClick={() => updateClaimStatus(claim.id, 'failed')}><XCircle size={16} /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8F9FC] font-body overflow-hidden">
      <aside className="w-64 bg-white border-r border-[#E8E6FF] flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
              <Shield className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-[#1A1A2E]">GigShield<span className="text-[#6C47FF] text-xs ml-1 font-black">ADMIN</span></span>
          </div>
          <nav className="space-y-1">
            {[
              { id: "Dashboard", icon: LayoutDashboard },
              { id: "Worker Directory", icon: Users },
              { id: "Claims Queue", icon: Bell },
              { id: "Support Chat", icon: Headphones },
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-[#EDE9FF] text-[#6C47FF]" : "text-[#64748B] hover:bg-[#F8F9FF]"}`}
              >
                <item.icon size={18} /> {item.id}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-[#E8E6FF]">
          <button onClick={() => router.push("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#EF4444] hover:bg-red-50 transition-all">
            <LogOut size={18} /> Exit Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-[#E8E6FF] px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">{activeTab}</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#DCFCE7] border border-[#BBF7D0] rounded-full">
            <div className="h-2 w-2 bg-[#22C55E] rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-[#16A34A] uppercase tracking-widest">System Active</span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-70px)]">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Worker Directory' && renderWorkers()}
          {activeTab === 'Claims Queue' && renderClaims()}
          
          {activeTab === 'Support Chat' && (
            <div className="flex gap-6 h-full pb-8">
              <div className="w-80 bg-white border border-[#E8E6FF] rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[#F5F3FF] bg-[#F8F9FF]">
                  <h3 className="text-xs font-black uppercase text-[#94A3B8] tracking-widest">Open Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingMessages ? <div className="p-4"><Skeleton className="h-20 w-full rounded-xl"/></div> : 
                    threads.map(t => (
                    <button 
                      key={t.userId} 
                      onClick={() => setActiveChatUserId(t.userId)}
                      className={`w-full p-4 border-b border-[#F5F3FF] text-left hover:bg-[#F8F9FF] transition-all ${activeChatUserId === t.userId ? 'bg-[#EDE9FF] border-l-4 border-l-[#6C47FF]' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-[#1A1A2E]">{t.userName}</span>
                        <Badge className="text-[8px] bg-[#EF4444] text-white border-none uppercase">{t.status}</Badge>
                      </div>
                      <p className="text-xs text-[#64748B] line-clamp-1 truncate italic">"{t.lastMessage}"</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-white border border-[#E8E6FF] rounded-2xl flex flex-col overflow-hidden relative">
                {activeChatUserId ? (
                  <>
                    <header className="p-4 border-b border-[#E8E6FF] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#6C47FF] rounded-full flex items-center justify-center text-white font-black">{userMap.get(activeChatUserId)?.name?.[0] || "W"}</div>
                        <h3 className="font-bold text-[#1A1A2E]">{userMap.get(activeChatUserId)?.name || "Worker"}</h3>
                      </div>
                      <Button onClick={resolveThread} variant="outline" size="sm" className="text-[#22C55E] border-[#22C55E] hover:bg-[#DCFCE7] font-bold">Mark Resolved</Button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {activeChatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${m.sender === 'admin' ? 'bg-[#6C47FF] text-white rounded-tr-none' : 'bg-[#F1F0FF] text-[#1A1A2E] rounded-tl-none'}`}>
                            <p>{m.message || m.text}</p>
                            <span className="text-[8px] mt-1 block opacity-60 uppercase font-black">{m.sender}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-[#E8E6FF] bg-[#F8F9FF]">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Type response..." 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                          className="bg-white rounded-xl"
                        />
                        <Button onClick={handleSendReply} className="bg-[#6C47FF] rounded-xl"><Send size={18} /></Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                    <MessageSquare size={48} className="text-[#D4CCFF] mb-4" />
                    <p className="font-bold text-[#1A1A2E]">Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}