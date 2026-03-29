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
  orderBy, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDoc, 
  addDoc, 
  limit 
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
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

/**
 * ADMIN SUPPORT PORTAL - CONNECTION ENDPOINT
 * Receives 'pending' issues from Worker Chatbot in real-time.
 */
export default function AdminSupportPortal() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkRole() {
      if (isUserLoading) return;
      if (!user) { router.replace("/login"); return; }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") setIsAdmin(true);
        else router.replace("/");
      } catch (error) { router.replace("/"); }
      finally { setCheckingAdmin(false); }
    }
    checkRole();
  }, [user, isUserLoading, db, router]);

  // REAL-TIME LISTENER: Watches for all support messages
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || checkingAdmin) return null;
    return query(collection(db, "support_messages"), orderBy("timestamp", "desc"), limit(500));
  }, [db, isAdmin, checkingAdmin]);

  const { data: rawMessages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  // Grouping logic: Consolidates flat messages into user threads
  const threads = useMemo(() => {
    if (!rawMessages) return [];
    const userGroups = new Map<string, any>();
    
    [...rawMessages].reverse().forEach(msg => {
      userGroups.set(msg.userId, {
        userId: msg.userId,
        userName: msg.userName || "Worker",
        lastMessage: msg.text || msg.message,
        status: msg.status || 'pending',
        timestamp: msg.timestamp,
      });
    });

    const threadList = Array.from(userGroups.values());
    threadList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    
    if (filter === 'all') return threadList;
    return threadList.filter(t => (filter === 'pending' ? (t.status === 'pending' || t.status === 'in-progress') : t.status === filter));
  }, [rawMessages, filter]);

  const activeChatMessages = useMemo(() => {
    if (!rawMessages || !activeChatUserId) return [];
    return rawMessages
      .filter(m => m.userId === activeChatUserId)
      .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
  }, [rawMessages, activeChatUserId]);

  const activeThread = threads.find(t => t.userId === activeChatUserId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeChatMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChatUserId || !db) return;
    
    const text = replyText;
    setReplyText("");

    // FIRESTORE WRITE: Store Admin Reply
    // Uses the same userId as the worker to ensure the worker's chatbot receives it
    await addDoc(collection(db, "support_messages"), {
      userId: activeChatUserId,
      userName: "GigShield Admin",
      text,
      message: text,
      sender: "admin",
      status: "in-progress",
      timestamp: serverTimestamp()
    });

    // Automatically transition 'pending' status to 'in-progress'
    const openMsgs = rawMessages?.filter(m => m.userId === activeChatUserId && m.status === 'pending') || [];
    for (const m of openMsgs) {
      await updateDoc(doc(db, "support_messages", m.id), { status: "in-progress" });
    }
  };

  const resolveTicket = async () => {
    if (!activeChatUserId || !db || !rawMessages) return;
    const threadMsgs = rawMessages.filter(m => m.userId === activeChatUserId && m.status !== 'resolved');
    for (const m of threadMsgs) {
      await updateDoc(doc(db, "support_messages", m.id), { status: "resolved" });
    }
    setActiveChatUserId(null);
  };

  if (isUserLoading || checkingAdmin) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden font-body">
      <aside className="w-64 bg-white border-r border-[#E8E6FF] flex flex-col shrink-0 p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn"><Shield className="text-white" /></div>
          <span className="text-xl font-bold">GigShield<span className="text-[#6C47FF] text-xs ml-1 font-black">ADMIN</span></span>
        </div>
        <nav className="space-y-1">
          <Link href="/admin"><Button variant="ghost" className="w-full justify-start gap-3 font-bold text-[#64748B] hover:bg-[#F5F3FF]"><LayoutDashboard size={18} /> Overview</Button></Link>
          <Link href="/admin/users"><Button variant="ghost" className="w-full justify-start gap-3 font-bold text-[#64748B] hover:bg-[#F5F3FF]"><Users size={18} /> Workers</Button></Link>
          <Button variant="ghost" className="w-full justify-start gap-3 font-bold bg-[#EDE9FF] text-[#6C47FF]"><Headphones size={18} /> Support Queue</Button>
        </nav>
        <Button onClick={() => auth.signOut()} variant="ghost" className="mt-auto w-full justify-start gap-3 font-bold text-[#EF4444] hover:bg-[#FEE2E2]"><LogOut size={18} /> Exit Admin</Button>
      </aside>

      <main className="flex-1 flex overflow-hidden">
        <section className="w-80 bg-white border-r border-[#E8E6FF] flex flex-col">
          <header className="p-6 border-b border-[#E8E6FF]">
            <h2 className="text-xl font-bold">Priority Queue</h2>
            <div className="flex gap-1 bg-[#F8F9FF] p-1 rounded-lg border mt-4">
              {(['all', 'pending', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-1 text-[10px] font-black uppercase py-1.5 rounded-md ${filter === f ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-[#94A3B8]'}`}>{f}</button>
              ))}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            {threads.map(thread => (
              <button key={thread.userId} onClick={() => setActiveChatUserId(thread.userId)} className={`w-full p-4 border-b text-left ${activeChatUserId === thread.userId ? 'bg-[#EDE9FF] border-l-4 border-l-[#6C47FF]' : 'hover:bg-[#F8F9FF]'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm truncate">{thread.userName}</span>
                  <Badge className={`text-[8px] h-4 font-black uppercase ${thread.status === 'pending' ? 'bg-[#EF4444]' : thread.status === 'resolved' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`}>{thread.status}</Badge>
                </div>
                <p className="text-xs text-[#64748B] line-clamp-1 italic">"{thread.lastMessage}"</p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex-1 flex flex-col bg-[#F8F9FF]">
          {activeThread ? (
            <>
              <header className="px-8 py-4 bg-white border-b border-[#E8E6FF] flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-[#6C47FF] rounded-full flex items-center justify-center text-white font-black">{activeThread.userName[0]}</div>
                  <div><h3 className="font-bold text-[#1A1A2E]">{activeThread.userName}</h3><p className="text-[10px] text-[#22C55E] font-black uppercase tracking-widest">Live Monitoring</p></div>
                </div>
                <Button variant="outline" size="sm" onClick={resolveTicket} className="text-[#22C55E] border-[#22C55E] hover:bg-[#DCFCE7] font-black gap-2 h-10 px-4 rounded-xl"><CheckCircle2 size={16} /> Mark Resolved</Button>
              </header>
              <div className="flex-1 overflow-y-auto p-8 space-y-6" ref={scrollRef}>
                {activeChatMessages.map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm shadow-sm ${m.sender === 'admin' ? 'bg-[#6C47FF] text-white rounded-tr-none' : 'bg-white border text-[#1A1A2E] rounded-tl-none'}`}>
                      <p>{m.text || m.message}</p>
                      <div className="text-[9px] mt-2 font-black uppercase opacity-60">{m.sender} • {m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), "HH:mm") : 'Syncing...'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-8 py-6 bg-white border-t">
                <div className="max-w-4xl mx-auto flex gap-4 bg-[#F8F9FF] border p-2 rounded-2xl">
                  <Input placeholder="Type response..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendReply()} className="flex-1 border-none focus-visible:ring-0 bg-transparent" />
                  <Button onClick={handleSendReply} className="h-12 w-12 rounded-xl bg-[#6C47FF]"><Send size={20} /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40"><MessageSquare size={64} className="text-[#6C47FF] mb-4" /><h3 className="text-xl font-bold">Select a conversation</h3></div>
          )}
        </section>
      </main>
    </div>
  );
}
