"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, getDoc, addDoc, limit } from "firebase/firestore";
import { Shield, LayoutDashboard, Users, LogOut, Loader2, Headphones, Send, MessageSquare, CheckCircle2, Bell, Lock, Search, Filter, User, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

/**
 * PRODUCTION ADMIN SUPPORT PORTAL
 * Features:
 * - Real-time thread grouping
 * - WhatsApp-style chat interface
 * - Robust RBAC Role Verification
 * - Automated scroll management
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
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Verify Administrative Session
  useEffect(() => {
    async function checkRole() {
      if (isUserLoading) return;
      if (!user) {
        router.replace("/login");
        setCheckingAdmin(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace("/");
        }
      } catch (error) {
        console.error("Auth check failed", error);
        router.replace("/");
      } finally {
        setCheckingAdmin(false);
      }
    }
    checkRole();
  }, [user, isUserLoading, db, router]);

  // 2. Real-time Subscription to All Support Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || checkingAdmin) return null;
    return query(collection(db, "support_messages"), orderBy("timestamp", "desc"), limit(200));
  }, [db, isAdmin, checkingAdmin]);

  const { data: rawMessages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  // 3. Logic: Group flat messages into "Threads" for the Sidebar
  const threads = useMemo(() => {
    if (!rawMessages) return [];
    
    const userGroups = new Map<string, any>();
    
    rawMessages.forEach(msg => {
      if (!userGroups.has(msg.userId)) {
        userGroups.set(msg.userId, {
          userId: msg.userId,
          userName: msg.userName || "Anonymous Worker",
          lastMessage: msg.text,
          status: msg.status || 'open',
          timestamp: msg.timestamp,
          unreadCount: 0 // Mock logic for production extension
        });
      }
    });

    const threadList = Array.from(userGroups.values());
    
    if (filter === 'all') return threadList;
    return threadList.filter(t => t.status === filter);
  }, [rawMessages, filter]);

  // 4. Logic: Filter and Sort messages for the ACTIVE chat window
  const activeChatMessages = useMemo(() => {
    if (!rawMessages || !activeChatUserId) return [];
    return rawMessages
      .filter(m => m.userId === activeChatUserId)
      .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
  }, [rawMessages, activeChatUserId]);

  const activeThread = threads.find(t => t.userId === activeChatUserId);

  // 5. UX: Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatMessages]);

  // 6. Action: Send Admin Reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChatUserId || !db) return;
    
    const text = replyText;
    setReplyText("");

    try {
      await addDoc(collection(db, "support_messages"), {
        userId: activeChatUserId,
        userName: activeThread?.userName || "Worker",
        text,
        sender: "admin",
        status: "in-progress",
        timestamp: serverTimestamp()
      });

      // Update entire thread to "in-progress" if it was "open"
      const threadMsgs = rawMessages?.filter(m => m.userId === activeChatUserId && m.status === 'open') || [];
      for (const m of threadMsgs) {
        await updateDoc(doc(db, "support_messages", m.id), { status: "in-progress" });
      }
    } catch (e) {
      console.error("Reply failed", e);
    }
  };

  // 7. Action: Resolve Ticket
  const resolveTicket = async () => {
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

  if (isUserLoading || checkingAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
          <Lock className="absolute inset-0 m-auto h-4 w-4 text-[#6C47FF]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1A1A2E] animate-pulse">Syncing Secure Command Center...</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-widest mt-1">Authorized Access Only</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden font-body">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#E8E6FF] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#E8E6FF]">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
              <Shield className="text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A2E]">GigShield<span className="text-[#6C47FF] text-xs ml-1">ADMIN</span></span>
          </div>
          
          <nav className="space-y-1">
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-[#64748B] hover:bg-[#F5F3FF] hover:text-[#6C47FF]">
                <LayoutDashboard size={18} /> Overview
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-[#64748B] hover:bg-[#F5F3FF] hover:text-[#6C47FF]">
                <Users size={18} /> Workers
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start gap-3 font-bold bg-[#EDE9FF] text-[#6C47FF]">
              <Headphones size={18} /> Support Queue
            </Button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#E8E6FF]">
          <Button onClick={() => auth.signOut().then(() => router.push("/"))} variant="ghost" className="w-full justify-start gap-3 font-bold text-[#EF4444] hover:bg-[#FEE2E2]">
            <LogOut size={18} /> Exit Portal
          </Button>
        </div>
      </aside>

      {/* Main Support Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Thread List (Left Pane) */}
        <section className="w-80 bg-white border-r border-[#E8E6FF] flex flex-col shadow-sm relative z-10">
          <header className="p-6 space-y-4 border-b border-[#E8E6FF]">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A2E]">Conversation Queue</h2>
              <p className="text-xs text-[#64748B]">Managing live worker disruptions</p>
            </div>
            
            <div className="flex gap-1 bg-[#F8F9FF] p-1 rounded-lg border border-[#E8E6FF]">
              {(['all', 'open', 'resolved'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-[10px] font-black uppercase py-1.5 rounded-md transition-all ${filter === f ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isMessagesLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="h-16 w-16 bg-[#F8F9FF] rounded-full flex items-center justify-center mx-auto text-[#D4CCFF]">
                  <MessageSquare size={32} />
                </div>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">No tickets found</p>
              </div>
            ) : (
              threads.map(thread => (
                <button 
                  key={thread.userId} 
                  onClick={() => setActiveChatUserId(thread.userId)}
                  className={`w-full p-4 border-b border-[#F5F3FF] text-left transition-all flex flex-col gap-2 ${activeChatUserId === thread.userId ? 'bg-[#EDE9FF] border-l-4 border-l-[#6C47FF]' : 'hover:bg-[#F8F9FF]'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="h-8 w-8 rounded-full bg-[#EDE9FF] flex items-center justify-center shrink-0">
                        <User size={14} className="text-[#6C47FF]" />
                      </div>
                      <span className="font-bold text-sm text-[#1A1A2E] truncate">{thread.userName}</span>
                    </div>
                    <Badge className={`text-[8px] h-4 font-black uppercase ${
                      thread.status === 'open' ? 'bg-[#EF4444]' : 
                      thread.status === 'resolved' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'
                    }`}>
                      {thread.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#64748B] line-clamp-1 italic">"{thread.lastMessage}"</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter">ID: {thread.userId.slice(0, 8)}</span>
                    <span className="text-[9px] text-[#94A3B8] font-bold">
                      {thread.timestamp?.seconds ? format(new Date(thread.timestamp.seconds * 1000), "HH:mm") : "Just now"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Chat Window (Right Pane) */}
        <section className="flex-1 flex flex-col bg-[#F8F9FF] relative">
          {activeThread ? (
            <>
              {/* Chat Header */}
              <header className="px-8 py-4 bg-white border-b border-[#E8E6FF] flex justify-between items-center shadow-sm z-20">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-[#6C47FF] to-[#A78BFF] rounded-full flex items-center justify-center text-white font-black text-lg">
                    {activeThread.userName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A2E] text-lg leading-none">{activeThread.userName}</h3>
                    <p className="text-[10px] text-[#22C55E] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" /> Active Connection
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={resolveTicket} className="text-[#22C55E] border-[#22C55E] hover:bg-[#DCFCE7] font-black gap-2 rounded-xl h-10 px-4">
                    <CheckCircle2 size={16} /> Mark Resolved
                  </Button>
                  <Button variant="ghost" size="icon" className="text-[#94A3B8] h-10 w-10 rounded-xl">
                    <MoreVertical size={20} />
                  </Button>
                </div>
              </header>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
                <AnimatePresence initial={false}>
                  {activeChatMessages.map((m, i) => (
                    <motion.div 
                      key={m.id || i} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[65%] group relative ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl text-sm shadow-sm transition-all ${
                          m.sender === 'admin' 
                            ? 'bg-[#6C47FF] text-white rounded-tr-none' : 
                          m.sender === 'bot' 
                            ? 'bg-[#F1F0FF] border border-[#D4CCFF] text-[#1A1A2E] rounded-tl-none italic' :
                            'bg-white border border-[#E8E6FF] text-[#1A1A2E] rounded-tl-none'
                        }`}>
                          <p className="leading-relaxed font-medium">{m.text}</p>
                          <div className={`text-[9px] mt-2 font-black uppercase tracking-tighter opacity-60 ${m.sender === 'admin' ? 'text-white' : 'text-[#64748B]'}`}>
                            {m.sender} • {m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), "HH:mm") : 'Syncing...'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="px-8 py-6 bg-white border-t border-[#E8E6FF] z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                <div className="max-w-4xl mx-auto flex gap-4 items-center bg-[#F8F9FF] border border-[#E8E6FF] p-2 rounded-[20px] focus-within:ring-2 focus-within:ring-[#6C47FF]/20 transition-all">
                  <Input 
                    placeholder="Type official GigShield response..." 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    className="flex-1 h-12 rounded-xl bg-transparent border-none focus-visible:ring-0 text-sm font-medium"
                  />
                  <Button onClick={handleSendReply} className="h-12 w-12 rounded-[14px] bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0 transition-transform active:scale-95">
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-6">
              <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-card border border-[#E8E6FF]">
                <MessageSquare className="h-12 w-12 text-[#D4CCFF]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#1A1A2E]">Ready to Assist</h3>
                <p className="text-[#64748B] text-sm max-w-[280px] mx-auto">
                  Select a worker from the queue to manage their disruptions and parametric coverage status.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[#94A3B8] font-bold text-[10px] uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> Systems Operational
              </div>
            </div>
          )}
        </section>
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
