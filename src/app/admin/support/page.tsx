
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, getDoc, addDoc } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Users, LogOut, Loader2, Headphones, Send, MessageSquare, CheckCircle2 } from "lucide-react";
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

  // Check Admin Permissions
  useEffect(() => {
    async function checkRole() {
      if (user) {
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
      } else if (!isUserLoading) {
        router.replace("/");
        setCheckingAdmin(false);
      }
    }
    checkRole();
  }, [user, isUserLoading, db, router]);

  // Fetch all recent support messages
  const allMessagesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || checkingAdmin) return null;
    return query(collection(db, "support_messages"), orderBy("timestamp", "desc"));
  }, [db, isAdmin, checkingAdmin]);

  const { data: allMessages } = useCollection(allMessagesQuery);

  // Unique list of users needing support
  const activeTickets = Array.from(new Set(allMessages?.filter(m => m.status !== 'resolved').map(m => m.userId)))
    .map(uid => {
      const lastMsg = allMessages?.find(m => m.userId === uid);
      return { userId: uid, userName: lastMsg?.userName || "Anonymous Worker", lastText: lastMsg?.text, status: lastMsg?.status };
    });

  // Filter messages for the active selected chat
  const activeChatMessages = allMessages?.filter(m => m.userId === activeChatUserId).sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

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

      // Update all user's messages to 'in-progress'
      const openMsgs = allMessages?.filter(m => m.userId === activeChatUserId && m.status === 'open');
      for (const m of (openMsgs || [])) {
        await updateDoc(doc(db, "support_messages", m.id), { status: "in-progress" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resolveTicket = async () => {
    if (!activeChatUserId || !db) return;
    const userMsgs = allMessages?.filter(m => m.userId === activeChatUserId);
    for (const m of (userMsgs || [])) {
      await updateDoc(doc(db, "support_messages", m.id), { status: "resolved" });
    }
    setActiveChatUserId(null);
  };

  if (isUserLoading || checkingAdmin) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;
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
              <SidebarMenuItem><SidebarMenuButton isActive><Headphones className="h-4 w-4" /><span>Support Queue</span></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t">
            <SidebarMenuButton onClick={() => router.push("/")} className="text-[#EF4444] font-bold"><LogOut className="h-4 w-4" /><span>Logout</span></SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex overflow-hidden">
          {/* Ticket List */}
          <section className="w-80 border-r border-[#E8E6FF] bg-white flex flex-col">
            <header className="p-6 border-b border-[#E8E6FF]">
              <h2 className="font-bold text-lg text-[#1A1A2E]">Active Tickets</h2>
              <p className="text-xs text-[#64748B]">Real-time support requests</p>
            </header>
            <div className="flex-1 overflow-y-auto">
              {activeTickets.length === 0 ? (
                <div className="p-10 text-center text-[#94A3B8] italic text-xs">No active tickets.</div>
              ) : (
                activeTickets.map(ticket => (
                  <button 
                    key={ticket.userId} 
                    onClick={() => setActiveChatUserId(ticket.userId)}
                    className={`w-full p-4 border-b text-left hover:bg-[#F5F3FF] transition-colors ${activeChatUserId === ticket.userId ? 'bg-[#EDE9FF] border-l-4 border-l-[#6C47FF]' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-[#1A1A2E]">{ticket.userName}</span>
                      <Badge className={ticket.status === 'open' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}>{ticket.status}</Badge>
                    </div>
                    <p className="text-xs text-[#64748B] line-clamp-1">{ticket.lastText}</p>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Chat Window */}
          <section className="flex-1 flex flex-col bg-[#F8F9FF]">
            {activeChatUserId ? (
              <>
                <header className="p-6 bg-white border-b border-[#E8E6FF] flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="font-bold text-[#1A1A2E]">{activeTickets.find(t => t.userId === activeChatUserId)?.userName}</h3>
                    <p className="text-xs text-[#22C55E] flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" /> Active Session</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={resolveTicket} className="text-[#22C55E] border-[#22C55E] hover:bg-[#DCFCE7] font-bold gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                  </Button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                  <AnimatePresence initial={false}>
                    {activeChatMessages?.map((m, i) => (
                      <div key={m.id || i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                          m.sender === 'admin' ? 'bg-[#6C47FF] text-white rounded-tr-none' : 'bg-white border border-[#E8E6FF] text-[#1A1A2E] rounded-tl-none'
                        }`}>
                          <p>{m.text}</p>
                          <span className="text-[9px] opacity-50 uppercase font-bold mt-1 block">{m.sender}</span>
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-6 bg-white border-t border-[#E8E6FF]">
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Type agent response..." 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      className="h-12 rounded-xl"
                    />
                    <Button onClick={handleSendReply} className="h-12 w-12 rounded-xl bg-[#6C47FF]"><Send className="h-5 w-5" /></Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <div className="h-20 w-20 bg-[#EDE9FF] rounded-full flex items-center justify-center text-[#6C47FF]">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E]">Select a conversation</h3>
                <p className="text-[#64748B] max-w-xs">Pick a support ticket from the left queue to start assisting workers in real-time.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}
