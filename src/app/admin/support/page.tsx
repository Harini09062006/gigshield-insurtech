"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, getDoc, addDoc } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Users, LogOut, Loader2, Headphones, Send, MessageSquare, CheckCircle2, Bell, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSupport() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Verify Admin Session
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
        console.error("Role check failed", error);
        router.replace("/");
      } finally {
        setCheckingAdmin(false);
      }
    }
    checkRole();
  }, [user, isUserLoading, db, router]);

  // 2. Gate collection query until admin role is confirmed
  const allMessagesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || checkingAdmin) return null;
    return query(collection(db, "support_messages"), orderBy("timestamp", "desc"));
  }, [db, isAdmin, checkingAdmin]);

  const { data: allMessages, isLoading: isMessagesLoading } = useCollection(allMessagesQuery);

  // 3. Thread Grouping Logic
  const activeTickets = Array.from(new Set(allMessages?.filter(m => m.status !== 'resolved').map(m => m.userId)))
    .map(uid => {
      const userMsgs = allMessages?.filter(m => m.userId === uid);
      const lastMsg = userMsgs?.[0];
      return { 
        userId: uid, 
        userName: lastMsg?.userName || "Anonymous Worker", 
        lastText: lastMsg?.text, 
        status: lastMsg?.status,
        timestamp: lastMsg?.timestamp
      };
    });

  const activeChatMessages = allMessages
    ?.filter(m => m.userId === activeChatUserId)
    .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeChatMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChatUserId || !db) return;
    
    const text = replyText;
    setReplyText("");

    try {
      await addDoc(collection(db, "support_messages"), {
        userId: activeChatUserId,
        text,
        sender: "admin",
        status: "in-progress",
        timestamp: serverTimestamp()
      });

      const openMsgs = allMessages?.filter(m => m.userId === activeChatUserId && m.status === 'open');
      for (const m of (openMsgs || [])) {
        await updateDoc(doc(db, "support_messages", m.id), { status: "in-progress" });
      }
    } catch (e) {
      console.error("Reply failed", e);
    }
  };

  const resolveTicket = async () => {
    if (!activeChatUserId || !db) return;
    try {
      const userMsgs = allMessages?.filter(m => m.userId === activeChatUserId && m.status !== 'resolved');
      for (const m of (userMsgs || [])) {
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
        <p className="text-sm font-bold text-[#1A1A2E] animate-pulse">Syncing Admin Session...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden">
        <Sidebar className="border-r border-[#E8E6FF] bg-white">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#6C47FF]" />
              <span className="text-xl font-headline font-bold">GigShield<span className="text-[#6C47FF] text-xs ml-1">ADMIN</span></span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem><Link href="/admin"><SidebarMenuButton><LayoutDashboard className="h-4 w-4" /><span>Overview</span></SidebarMenuButton></Link></SidebarMenuItem>
              <SidebarMenuItem><Link href="/admin/users"><SidebarMenuButton><Users className="h-4 w-4" /><span>Workers</span></SidebarMenuButton></Link></SidebarMenuItem>
              <SidebarMenuItem><Link href="/admin/claims"><SidebarMenuButton><Bell className="h-4 w-4" /><span>Claims</span></SidebarMenuButton></Link></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive><Headphones className="h-4 w-4" /><span>Support Queue</span></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t">
            <SidebarMenuButton onClick={() => router.push("/")} className="text-[#EF4444] font-bold"><LogOut className="h-4 w-4" /><span>Exit Portal</span></SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex overflow-hidden">
          <section className="w-80 border-r border-[#E8E6FF] bg-white flex flex-col shadow-sm relative z-10">
            <header className="p-6 border-b border-[#E8E6FF]">
              <h2 className="font-bold text-lg text-[#1A1A2E]">Active Tickets</h2>
              <p className="text-xs text-[#64748B]">Pending manual intervention</p>
            </header>
            <div className="flex-1 overflow-y-auto">
              {isMessagesLoading ? (
                <div className="p-10 flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#6C47FF] h-6 w-6" />
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Syncing Threads...</p>
                </div>
              ) : activeTickets.length === 0 ? (
                <div className="p-10 text-center text-[#94A3B8] italic text-xs">No active tickets.</div>
              ) : (
                activeTickets.map(ticket => (
                  <button 
                    key={ticket.userId} 
                    onClick={() => setActiveChatUserId(ticket.userId)}
                    className={`w-full p-4 border-b text-left hover:bg-[#F5F3FF] transition-all flex flex-col gap-1 ${activeChatUserId === ticket.userId ? 'bg-[#EDE9FF] border-l-4 border-l-[#6C47FF]' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-[#1A1A2E] truncate max-w-[140px]">{ticket.userName}</span>
                      <Badge className={`text-[9px] h-5 ${ticket.status === 'open' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`}>{ticket.status}</Badge>
                    </div>
                    <p className="text-xs text-[#64748B] line-clamp-1">{ticket.lastText}</p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="flex-1 flex flex-col bg-[#F8F9FF]">
            {activeChatUserId ? (
              <>
                <header className="p-6 bg-white border-b border-[#E8E6FF] flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#EDE9FF] rounded-full flex items-center justify-center text-[#6C47FF] font-bold">
                      {activeTickets.find(t => t.userId === activeChatUserId)?.userName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A2E] leading-tight">{activeTickets.find(t => t.userId === activeChatUserId)?.userName}</h3>
                      <p className="text-xs text-[#22C55E] flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" /> Active Session</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={resolveTicket} className="text-[#22C55E] border-[#22C55E] hover:bg-[#DCFCE7] font-bold gap-2 rounded-xl">
                    <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                  </Button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                  <AnimatePresence initial={false}>
                    {activeChatMessages?.map((m, i) => (
                      <motion.div 
                        key={m.id || i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                          m.sender === 'admin' ? 'bg-[#6C47FF] text-white rounded-tr-none' : 
                          m.sender === 'bot' ? 'bg-[#EEEEFF] border border-[#D4CCFF] text-[#1A1A2E] rounded-tl-none italic' :
                          'bg-white border border-[#E8E6FF] text-[#1A1A2E] rounded-tl-none'
                        }`}>
                          <p className="leading-relaxed">{m.text}</p>
                          <div className={`text-[9px] opacity-50 uppercase font-black mt-2 tracking-tighter ${m.sender === 'admin' ? 'text-white' : 'text-[#64748B]'}`}>
                            {m.sender} • {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-6 bg-white border-t border-[#E8E6FF]">
                  <div className="max-w-4xl mx-auto flex gap-3">
                    <Input 
                      placeholder="Type official response..." 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      className="h-12 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]"
                    />
                    <Button onClick={handleSendReply} className="h-12 w-12 rounded-xl bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0">
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <div className="h-20 w-20 bg-[#EDE9FF] rounded-full flex items-center justify-center text-[#6C47FF]">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E]">Select a conversation</h3>
                <p className="text-[#64748B] max-w-xs mx-auto">Pick a support ticket from the queue to start assisting workers in real-time.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}