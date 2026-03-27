
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Brain, Send, Loader2, Home, LogOut, Shield, 
  AlertTriangle, User, Headphones, Clock, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, limit, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCityRainfall } from "@/services/weatherService";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id?: string;
  userId: string;
  text: string;
  sender: "user" | "bot" | "admin";
  status: "open" | "in-progress" | "resolved";
  timestamp: any;
  userName?: string;
}

export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Worker Profile
  const profileRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null), 
    [db, user]
  );
  const { data: profile } = useDoc(profileRef);

  // Real-time Message Listener
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "support_messages"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "asc"),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: messages } = useCollection<Message>(messagesQuery);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || !db) return;

    setLoading(true);
    setInput("");

    try {
      // 1. Save User Message
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName: profile?.name || "Worker",
        text,
        sender: "user",
        status: "open",
        timestamp: serverTimestamp()
      });

      // 2. Chatbot Logic
      const lowText = text.toLowerCase();
      let botResponse = "";
      let needsEscalation = false;

      if (lowText.includes("rain") || lowText.includes("weather") || lowText.includes("risk")) {
        const rainfall = await getCityRainfall(profile?.city || "Mumbai");
        botResponse = `Currently, the rainfall in ${profile?.city || 'your city'} is ${rainfall.toFixed(1)}mm. Your Pro Shield plan is monitoring this risk for automatic payouts.`;
      } else if (lowText.includes("payment") || lowText.includes("claim") || lowText.includes("problem") || lowText.includes("not received")) {
        botResponse = "I've detected a complex issue regarding your earnings/payouts. I am escalating this to our human support team. They will reply here shortly. Please stay online.";
        needsEscalation = true;
      } else if (lowText.includes("hi") || lowText.includes("hello")) {
        botResponse = `Hello ${profile?.name?.split(' ')[0] || 'there'}! I'm the GigShield AI. I can help with weather risk, or connect you to a human agent for payment/claim issues. How can I help?`;
      } else {
        botResponse = "I'm not quite sure about that. If you have a problem with a claim or payment, type 'Problem' and I'll connect you to an agent.";
      }

      // 3. Save Bot Response
      if (botResponse) {
        await addDoc(collection(db, "support_messages"), {
          userId: user.uid,
          text: botResponse,
          sender: "bot",
          status: needsEscalation ? "open" : "resolved",
          timestamp: serverTimestamp()
        });
      }

    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;

  const activeStatus = messages?.findLast(m => m.status === "open" || m.status === "in-progress")?.status;

  return (
    <div className="h-screen bg-[#EEEEFF] flex flex-col font-body overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white shadow-sm shrink-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">
            Gig<span className="text-[#6C47FF]">Shield</span> Support
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-[#64748B] hover:bg-[#F5F3FF] rounded-xl"><Home /></Button>
          </Link>
          <Button onClick={() => auth.signOut().then(() => router.push("/"))} variant="ghost" size="icon" className="text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl"><LogOut /></Button>
        </div>
      </header>

      {activeStatus && (
        <div className="bg-[#6C47FF] px-6 py-2 flex items-center justify-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">
          <Clock className="h-3 w-3" /> {activeStatus === 'open' ? 'Waiting for agent...' : 'Agent is typing...'}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages?.map((m, i) => (
            <motion.div 
              key={m.id || i} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] flex gap-3 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  m.sender === 'user' ? 'bg-[#6C47FF] text-white' : 
                  m.sender === 'bot' ? 'bg-white border text-[#6C47FF]' : 
                  'bg-[#22C55E] text-white'
                }`}>
                  {m.sender === 'user' ? <User className="h-4 w-4" /> : 
                   m.sender === 'bot' ? <Brain className="h-4 w-4" /> : 
                   <Headphones className="h-4 w-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                  m.sender === "user" 
                    ? "bg-[#6C47FF] text-white rounded-tr-none" 
                    : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"
                }`}>
                  <p className="leading-relaxed">{m.text}</p>
                  <p className="text-[9px] mt-2 opacity-50 font-bold uppercase">
                    {m.sender.toUpperCase()} • {m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-white border-t border-[#E8E6FF]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input 
            placeholder="Describe your issue (e.g. 'Payment missing')..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 h-12 rounded-full border-2 border-[#E8E6FF] px-6 focus:border-[#6C47FF] transition-all"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || loading}
            className="rounded-full h-12 w-12 bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
