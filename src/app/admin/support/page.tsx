
"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  useFirestore, 
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
  onSnapshot
} from "firebase/firestore";
import { 
  Shield, 
  LayoutDashboard, 
  LogOut, 
  Loader2, 
  Headphones, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  User, 
  Search,
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
import { firebaseConfig } from "@/firebase/config";

export default function AdminSupportPortal() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [issues, setIssues] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. PROJECT & DB VERIFICATION
  useEffect(() => {
    console.log("🔥 ADMIN SUPPORT LOADED");
    console.log("🔥 PROJECT ID:", firebaseConfig.projectId);
    console.log("🔥 DB INSTANCE:", db);
    
    if (!db) {
      console.error("❌ DB is undefined - Firestore connection failed");
      return;
    }

    // RAW DATA LISTENER (DEBUG ONLY)
    const unsubscribe = onSnapshot(collection(db, "chats"), (snapshot) => {
      console.log("🔥 RAW SNAPSHOT SIZE (chats):", snapshot.size);
      
      if (snapshot.empty) {
        console.warn("⚠️ No documents found in 'chats' collection. Check Project ID and Collection Name.");
      }

      snapshot.forEach((doc) => {
        console.log("📄 RAW DOCUMENT FOUND:", doc.id, doc.data());
      });
    }, (error) => {
      console.error("❌ FIRESTORE RAW LISTENER ERROR:", error);
    });

    return () => unsubscribe();
  }, [db]);

  // 2. AUTH & ROLE CHECK
  useEffect(() => {
    async function checkRole() {
      if (isUserLoading) return;
      if (!user) { 
        console.warn("⚠️ No user found, redirecting to login");
        router.replace("/login"); 
        return; 
      }
      
      try {
        console.log("🔍 Checking role for UID:", user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("👤 USER DATA:", data);
          if (data.role === "admin") {
            setIsAdmin(true);
            console.log("✅ Admin access granted");
          } else {
            console.warn("🚫 Access denied: User is not an admin. Role:", data.role);
            router.replace("/dashboard");
          }
        } else {
          console.error("❌ User document not found in /users collection");
          router.replace("/dashboard");
        }
      } catch (error) { 
        console.error("❌ Role check failed:", error);
        router.replace("/dashboard"); 
      } finally { 
        setCheckingAdmin(false); 
      }
    }
    checkRole();
  }, [user, isUserLoading, db, router]);

  // 3. ADMIN FILTERED LISTENER
  useEffect(() => {
    if (!db || !isAdmin) return;

    console.log("📡 Starting priority queue listener (type: payment_issue, status: pending_admin)...");
    const q = query(
      collection(db, "chats"),
      where("type", "==", "payment_issue"),
      where("status", "==", "pending_admin")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("📬 FILTERED QUEUE SIZE:", snapshot.size);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Deduplicate by userId
      const uniqueIssues = Array.from(new Map(data.map(item => [item.userId, item])).values());
      setIssues(uniqueIssues);
    }, (error) => {
      console.error("❌ Filtered listener error:", error);
    });

    return () => unsubscribe();
  }, [db, isAdmin]);

  // 4. REAL-TIME MESSAGES FOR SELECTED WORKER
  useEffect(() => {
    if (!selectedIssue?.userId || !db) return;
    
    const q = query(
      collection(db, "chats"),
      where("userId", "==", selectedIssue.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedIssue?.userId, db]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedIssue || !db) return;
    const text = replyText;
    setReplyText("");

    try {
      await addDoc(collection(db, "chats"), {
        userId: selectedIssue.userId,
        userName: selectedIssue.userName || "Worker",
        message: text,
        sender: "admin",
        type: "payment_issue",
        status: "resolved",
        createdAt: serverTimestamp()
      });

      const pendingMessages = messages.filter(m => m.status === 'pending_admin');
      for (const msg of pendingMessages) {
        await updateDoc(doc(db, "chats", msg.id), { status: "resolved" });
      }

    } catch (e) {
      console.error("❌ Admin reply error:", e);
    }
  };

  const markResolved = async (issue: any) => {
    if (selectedIssue?.userId === issue.userId) setSelectedIssue(null);
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
              <Badge className="bg-[#6C47FF] text-white border-none">{issues.length}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input placeholder="Search issues..." className="pl-10 h-10 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {issues.length === 0 ? (
            <div className="p-10 text-center opacity-40"><MessageSquare size={48} className="mx-auto mb-2" /><p className="text-sm font-bold">No active escalations</p></div>
          ) : (
            issues.map((t: any) => (
              <button 
                key={t.id} 
                onClick={() => setSelectedIssue(t)}
                className={`w-full p-5 border-b border-[#E8E6FF] text-left transition-all hover:bg-[#F8F9FF] ${selectedIssue?.userId === t.userId ? 'bg-[#EDE9FF] border-l-4 border-l-[#6C47FF]' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge className="text-[8px] font-black uppercase border-none bg-[#EF4444]">
                    PENDING
                  </Badge>
                  <span className="text-[10px] font-bold text-[#94A3B8]">{t.createdAt?.seconds ? format(new Date(t.createdAt.seconds * 1000), "HH:mm") : 'Syncing...'}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm">{t.userName || "Worker"}</h4>
                  <AlertTriangle size={12} className="text-amber-500" />
                </div>
                <p className="text-xs font-medium text-[#64748B] truncate mb-3">{t.workerCity} • {t.workerPlan?.toUpperCase()}</p>
                <p className="text-[11px] italic text-[#64748B] line-clamp-1">"{t.message}"</p>
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
        {selectedIssue ? (
          <>
            <header className="px-8 py-4 bg-white border-b border-[#E8E6FF] flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#6C47FF] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-btn">
                  {selectedIssue.userName?.[0] || "W"}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedIssue.userName || "Worker"}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                    <span className="flex items-center gap-1"><Clock size={12} /> Active Escalation</span>
                    <span className="text-[#6C47FF]">•</span>
                    <span>Plan: {selectedIssue.workerPlan?.toUpperCase() || "PRO"}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => markResolved(selectedIssue)}
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
                      <p className="leading-relaxed">{m.message}</p>
                      <div className="text-[9px] mt-2 font-black uppercase opacity-60">
                        {m.sender} • {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), "HH:mm") : 'Syncing...'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-[#E8E6FF] shadow-[0_-8px_30_rgba(0,0,0,0.02)]">
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
