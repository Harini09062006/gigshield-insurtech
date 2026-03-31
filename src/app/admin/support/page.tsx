
"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser, 
  useAuth 
} from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDoc, 
  addDoc, 
  limit, 
  onSnapshot,
  getDocs
} from "firebase/firestore";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Loader2, 
  Headphones, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  User, 
  Lock,
  Search,
  ChevronRight,
  Clock,
  Brain,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function AdminSupportPortal() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. AUTH & ROLE CHECK
  useEffect(() => {
    async function checkRole() {
      if (isUserLoading) return;
      if (!user) { router.replace("/login"); return; }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") setIsAdmin(true);
        else router.replace("/dashboard");
      } catch (error) { router.replace("/dashboard"); }
      finally { setCheckingAdmin(false); }
    }
    checkRole();
  }, [user, isUserLoading, db, router]);

  // 2. REAL-TIME TICKET QUEUE (Focus on Open/Pending Admin)
  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(
      collection(db, "support_tickets"),
      where("status", "!=", "resolved"),
      limit(50)
    );
  }, [db, isAdmin]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection(ticketsQuery);

  // 3. REAL-TIME MESSAGES FOR SELECTED TICKET
  useEffect(() => {
    if (!selectedTicket || !db) return;
    const q = query(
      collection(db, "support_messages"),
      where("userId", "==", selectedTicket.workerId),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs.sort((a: any, b: any) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
    });
    return () => unsubscribe();
  }, [selectedTicket, db]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !db) return;
    const text = replyText;
    setReplyText("");

    try {
      // 1. Add Admin Message
      await addDoc(collection(db, "support_messages"), {
        userId: selectedTicket.workerId,
        text,
        sender: "admin",
        senderName: "GigShield Support",
        status: "in_progress",
        timestamp: serverTimestamp()
      });

      // 2. Mark existing escalated user messages as 'resolved' (or in_progress)
      const escalatedMsgsQuery = query(
        collection(db, "support_messages"),
        where("userId", "==", selectedTicket.workerId),
        where("status", "==", "pending_admin")
      );
      const escalatedMsgs = await getDocs(escalatedMsgsQuery);
      escalatedMsgs.forEach(async (m) => {
        await updateDoc(doc(db, "support_messages", m.id), { status: "resolved" });
      });

      // 3. Update Ticket
      const ticketRef = doc(db, "support_tickets", selectedTicket.id);
      await updateDoc(ticketRef, {
        status: "in_progress",
        lastMessage: text,
        unreadByWorker: true,
        unreadByAdmin: false,
        lastReplyAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Admin reply error:", e);
    }
  };

  const resolveTicket = async (ticket: any) => {
    try {
      await updateDoc(doc(db, "support_tickets", ticket.id), {
        status: "resolved",
        resolvedAt: serverTimestamp()
      });
      if (selectedTicket?.id === ticket.id) setSelectedTicket(null);
    } catch (e) {
      console.error("Resolve error:", e);
    }
  };

  if (isUserLoading || checkingAdmin) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden font-body text-[#1A1A2E]">
      {/* SIDEBAR TICKET QUEUE */}
      <aside className="w-80 bg-white border-r border-[#E8E6FF] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#E8E6FF]">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn"><Shield className="text-white" /></div>
            <span className="text-xl font-bold">GigShield<span className="text-[#6C47FF] text-xs ml-1 font-black">SUPPORT</span></span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-widest">
              <span>Active Escalations</span>
              <Badge className="bg-[#6C47FF] text-white border-none">{tickets?.length || 0}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input placeholder="Search tickets..." className="pl-10 h-10 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isTicketsLoading ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#6C47FF] opacity-40" /></div>
          ) : tickets?.length === 0 ? (
            <div className="p-10 text-center opacity-40"><MessageSquare size={48} className="mx-auto mb-2" /><p className="text-sm font-bold">No active escalations</p></div>
          ) : (
            tickets?.map((t: any) => (
              <button 
                key={t.id} 
                onClick={() => setSelectedTicket(t)}
                className={`w-full p-5 border-b border-[#E8E6FF] text-left transition-all hover:bg-[#F8F9FF] ${selectedTicket?.id === t.id ? 'bg-[#EDE9FF] border-l-4 border-l-[#6C47FF]' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`text-[8px] font-black uppercase border-none ${t.status === 'open' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`}>
                    {t.status}
                  </Badge>
                  <span className="text-[10px] font-bold text-[#94A3B8]">{format(t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000) : new Date(), "HH:mm")}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm">#{t.ticketId}</h4>
                  {t.issue.toLowerCase().includes('payment') && <AlertTriangle size={12} className="text-amber-500" />}
                </div>
                <p className="text-xs font-medium text-[#64748B] truncate mb-3">{t.workerName} • {t.workerCity}</p>
                <p className="text-[11px] italic text-[#64748B] line-clamp-1">"{t.issue}"</p>
              </button>
            ))
          )}
        </div>

        <div className="p-6 border-t border-[#E8E6FF] bg-[#F8F9FF]">
          <Link href="/admin"><Button variant="ghost" className="w-full justify-start gap-3 font-bold text-[#64748B] hover:bg-white"><LayoutDashboard size={18} /> Admin Dashboard</Button></Link>
          <Button onClick={() => auth.signOut()} variant="ghost" className="w-full justify-start gap-3 font-bold text-[#EF4444] hover:bg-red-50 mt-2"><LogOut size={18} /> Exit Support</Button>
        </div>
      </aside>

      {/* ACTIVE CHAT WINDOW */}
      <main className="flex-1 flex flex-col bg-white">
        {selectedTicket ? (
          <>
            <header className="px-8 py-4 bg-white border-b border-[#E8E6FF] flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#6C47FF] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-btn">
                  {selectedTicket.workerName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedTicket.workerName}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                    <span className="flex items-center gap-1"><Clock size={12} /> Active Escalation</span>
                    <span className="text-[#6C47FF]">•</span>
                    <span>Plan: {selectedTicket.workerPlan.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => resolveTicket(selectedTicket)}
                className="text-[#22C55E] border-[#22C55E] hover:bg-[#DCFCE7] font-black gap-2 h-11 px-6 rounded-xl transition-all active:scale-95"
              >
                <CheckCircle2 size={18} /> Mark Resolved
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8F9FF] custom-scrollbar" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[70%] ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                      m.sender === 'user' ? 'bg-[#EDE9FF] text-[#6C47FF]' : 
                      m.sender === 'admin' ? 'bg-[#4C35B5] text-white' : 'bg-white border border-[#E8E6FF] text-[#6C47FF]'
                    }`}>
                      {m.sender === 'user' ? <User size={14} /> : (m.sender === 'admin' ? <Shield size={14} /> : <Brain size={14} />)}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm relative ${
                      m.sender === 'user' ? 'bg-[#6C47FF] text-white rounded-tr-none' : 
                      m.sender === 'admin' ? 'bg-[#4C35B5] text-white rounded-tl-none' : 'bg-white border border-[#E8E6FF] text-[#1A1A2E] rounded-tl-none'
                    }`}>
                      {m.sender === 'admin' && <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">🛡️ Support Agent (You)</p>}
                      {m.status === 'pending_admin' && <Badge className="bg-red-500 text-white border-none text-[7px] mb-2 font-black uppercase">Escalated</Badge>}
                      <p className="leading-relaxed">{m.text}</p>
                      <div className="text-[9px] mt-2 font-black uppercase opacity-60">
                        {m.sender} • {m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), "HH:mm") : 'Syncing...'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-[#E8E6FF] shadow-[0_-8px_30px_rgba(0,0,0,0.02)]">
              <div className="max-w-4xl mx-auto flex gap-4 bg-[#F8F9FF] border border-[#E8E6FF] p-2 rounded-2xl">
                <Input 
                  placeholder="Type your response to worker..." 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  className="flex-1 border-none bg-transparent focus-visible:ring-0 text-sm font-medium h-12 px-4" 
                />
                <Button onClick={handleSendReply} className="h-12 w-12 rounded-xl bg-[#6C47FF] shadow-btn active:scale-95"><Send size={20} /></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-40">
            <div className="h-24 w-24 bg-[#EDE9FF] rounded-[32px] flex items-center justify-center mb-6">
              <Headphones size={48} className="text-[#6C47FF]" />
            </div>
            <h2 className="text-2xl font-black mb-2 uppercase tracking-widest">Escalation Queue</h2>
            <p className="text-sm font-medium max-w-xs">Select a payment issue from the sidebar to provide priority assistance.</p>
          </div>
        )}
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
