"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Home, LogOut, Shield, Brain, User as UserIcon, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useUser,
  useAuth,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase
} from "@/firebase";
import {
  doc,
  collection,
  query,
  where,
  limit,
  addDoc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user?.uid]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // FETCH MESSAGES WITHOUT ORDERBY (Permission Fix for Prototypes)
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "support_messages"),
      where("userId", "==", user.uid),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: rawMessages } = useCollection(messagesQuery);

  // Client-side sort by timestamp to ensure chronological order without index requirements
  const messages = useMemo(() => {
    if (!rawMessages) return [];
    return [...rawMessages].sort((a, b) => {
      const tA = a.timestamp?.seconds || 0;
      const tB = b.timestamp?.seconds || 0;
      return tA - tB;
    });
  }, [rawMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const generateResponse = async (userMsg: string) => {
    const text = userMsg.toLowerCase();
    const name = profile?.name || "Worker";

    // 1. GREETINGS
    if (text.match(/\b(hi|hello|hey|greetings)\b/)) {
      return `Hi ${name}! 👋 I'm your GigShield AI Assistant!\n\nI can help you with:\n🌧️ Weather & Rain Risk\n💰 Earnings & Income DNA\n🛡️ Your Coverage Details\n⚡ Filing Claims\n📊 Weekly Reports\n👤 Talk to Human Agent\n\nWhat would you like to know today?`;
    }

    // 2. WEATHER & RAIN
    if (text.match(/\b(rain|weather|risk|storm)\b/)) {
      try {
        const API_KEY = "be5f61ff6b261dedfa89e321d466a063";
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${profile?.city || "Chennai"},IN&units=metric&appid=${API_KEY}`);
        const data = await res.json();
        const rainfall = data.rain?.['1h'] || 0;
        const risk = rainfall > 10 ? 85 : 35;
        return `Current weather in ${profile?.city}: ${data.weather[0].description}. \n🌧️ Rainfall: ${rainfall}mm \n⚠️ Disruption Risk: ${risk}% \n\nYour Pro Shield plan is monitoring these conditions live.`;
      } catch (e) {
        return "I'm monitoring the skies! There's currently a 35% risk of disruption in your zone.";
      }
    }

    // 3. PLAN & COVERAGE
    if (text.match(/\b(plan|coverage|shield|details)\b/)) {
      return `🛡️ Your Active Plan: ${profile?.plan_id?.toUpperCase() || 'PRO'} SHIELD\n💰 Weekly Premium: ₹${profile?.premium || 25}\n⚡ Max Payout: ₹${profile?.coverage || 240}\n✅ Status: Active & Protected`;
    }

    // 4. CLAIMS
    if (text.match(/\b(claim|claims|history)\b/)) {
      return "I've checked your history. Your last claim was for ₹156 and was paid instantly via UPI. You have no pending claims.";
    }

    // 5. EARNINGS & DNA
    if (text.match(/\b(earn|income|salary|dna)\b/)) {
      return `📊 Your Income DNA Profile:\n🌅 Morning: ₹45/hr (0.75x)\n☀️ Afternoon: ₹57/hr (0.95x)\n🌆 Evening: ₹78/hr (1.30x) [PEAK]\n🌙 Night: ₹51/hr (0.85x)\n\nExpected Weekly: ₹3,360`;
    }

    // 6. SOS / EMERGENCY
    if (text.match(/\b(sos|emergency)\b/)) {
      return "🚨 SOS TRIGGERED! Please stay safe. Emergency Contacts:\n📞 112 (National Help)\n📞 100 (Police)\n📞 108 (Ambulance)\n\nI am alerting our field safety team of your location.";
    }

    // 7. HUMAN ESCALATION
    if (text.match(/\b(payment|problem|help|human|agent|talk|person|issue)\b/)) {
      const ticketId = `GS-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Create support ticket in Firebase
      await addDoc(collection(db, "support_tickets"), {
        ticketId,
        workerId: user?.uid,
        workerName: name,
        workerCity: profile?.city || "",
        workerPlan: profile?.plan_id || "pro",
        issue: userMsg,
        status: "open",
        createdAt: serverTimestamp(),
        lastMessage: userMsg,
        unreadByAdmin: true
      });

      setActiveTicketId(ticketId);
      return `🔗 Connecting to support agent...\n\n✅ Ticket #${ticketId} created!\n⏱️ Estimated wait: 2-3 minutes\n\nAn agent will join this chat shortly. You can keep chatting here while you wait! 💬`;
    }

    // FALLBACK
    return "I didn't quite catch that 😊 Try asking about 'rain risk', 'my plan', or 'income DNA'!";
  };

  const handleSend = async (msgOverride?: string) => {
    const text = (msgOverride || input).trim();
    if (!text || !user || !db) return;

    setInput("");
    setLoading(true);

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

      // 2. Generate Bot Response
      const reply = await generateResponse(text);

      // 3. Save Bot Response
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName: "GigShield Assistant",
        text: reply,
        sender: "bot",
        status: "resolved",
        timestamp: serverTimestamp()
      });

    } catch (e: any) {
      console.error("Support chat error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
        <p className="text-sm font-bold text-[#1A1A2E]">Initializing Support...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#EEEEFF] font-body">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1A1A2E] leading-none">Support Portal</h1>
            <p className="text-[10px] text-[#22C55E] font-black uppercase tracking-widest mt-1">AI Assistant Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B] hover:bg-[#EDE9FF]"><Home className="h-5 w-5" /></Button></Link>
          <Button onClick={() => auth.signOut()} variant="ghost" size="icon" className="text-[#EF4444] hover:bg-red-50"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      {activeTicketId && (
        <div className="bg-[#6C47FF] text-white px-6 py-2 flex items-center justify-between text-xs font-bold animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} />
            <span>🎫 Ticket #{activeTicketId} • Status: Open 🟡</span>
          </div>
          <span className="animate-pulse">Agent joining...</span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
        {messages?.length === 0 && (
          <div className="flex flex-col items-center py-20 opacity-40 text-center space-y-4">
            <Brain size={48} className="text-[#6C47FF]" />
            <p className="text-sm font-bold max-w-xs">Say "Hi" to start your protection audit.</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages?.map((m, i) => (
            <motion.div 
              key={m.id || i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  m.sender === "user" ? "bg-[#6C47FF] text-white" : 
                  m.sender === 'admin' ? "bg-[#4C35B5] text-white" : "bg-white border border-[#E8E6FF] text-[#6C47FF]"
                }`}>
                  {m.sender === "user" ? <UserIcon size={14} /> : (m.sender === 'admin' ? <Shield size={14} /> : <Brain size={14} />)}
                </div>
                <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm whitespace-pre-wrap ${
                  m.sender === "user" 
                    ? "bg-[#6C47FF] text-white rounded-tr-none" 
                    : m.sender === 'admin' ? "bg-[#4C35B5] text-white rounded-tl-none" : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"
                }`}>
                  {m.sender === 'admin' && <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">🛡️ Support Agent</p>}
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={`text-[9px] mt-2 font-black uppercase tracking-tighter opacity-60 ${m.sender === 'user' ? 'text-white' : 'text-[#64748B]'}`}>
                    {m.sender} • {m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), "HH:mm") : 'Syncing...'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-3 items-center opacity-60">
            <div className="h-8 w-8 rounded-full bg-white border border-[#E8E6FF] flex items-center justify-center text-[#6C47FF]"><Brain size={14} className="animate-pulse" /></div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6C47FF] flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Assistant Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-[#E8E6FF]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { label: "🌧️ Rain Risk?", val: "What is my rain risk today?" },
              { label: "💰 Earnings?", val: "Show my earnings info" },
              { label: "🛡️ My Plan", val: "Tell me about my plan" },
              { label: "📋 Claims", val: "Show my claim history" },
              { label: "🆘 SOS Help", val: "Emergency SOS" },
              { label: "👤 Talk to Human", val: "I want to talk to a human agent" }
            ].map((btn, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(btn.val)}
                className="whitespace-nowrap px-4 py-2 bg-[#EDE9FF] text-[#6C47FF] text-[11px] font-bold rounded-full border border-primary/20 hover:bg-[#6C47FF] hover:text-white transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 bg-[#F8F9FF] border border-[#E8E6FF] p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[#6C47FF]/10 transition-all">
            <Input 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm font-medium h-12 px-4"
            />
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || loading}
              className="h-12 w-12 rounded-xl bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0 transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E8E6FF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D4CCFF; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
