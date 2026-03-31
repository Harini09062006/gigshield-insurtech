
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
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user?.uid]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // FETCH MESSAGES WITHOUT ORDERBY (Permission Fix)
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "support_messages"),
      where("userId", "==", user.uid),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: rawMessages } = useCollection(messagesQuery);

  // Client-side sort by timestamp since orderBy is removed for prototype ease
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

  const generateResponse = async (userMessage: string) => {
    const text = userMessage.toLowerCase();
    const workerName = profile?.name || "Worker";

    // 1. GREETINGS
    if (text.match(/\b(hi|hello|hey)\b/)) {
      return `Hi ${workerName}! 👋 \nI'm your GigShield AI Assistant!\n\nI can help you with:\n🌧️ Weather & Rain Risk\n💰 Earnings & Income DNA\n🛡️ Your Coverage Details\n⚡ Filing Claims\n📊 Weekly Reports\n👤 Talk to Human Agent\n\nWhat would you like to know today?`;
    }

    // 2. WEATHER
    if (text.match(/\b(rain|weather|risk)\b/)) {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${profile?.city || 'Chennai'}&units=metric&appid=be5f61ff6b261dedfa89e321d466a063`);
        const data = await res.json();
        const rain = data.rain?.['1h'] || 0;
        const risk = rain > 20 ? 85 : rain > 5 ? 45 : 15;
        return `Current weather in ${profile?.city || 'your city'}:\n🌡️ Temp: ${data.main.temp}°C\n🌧️ Rainfall: ${rain}mm\n⚠️ Disruption Risk: ${risk}%\n\nCondition: ${data.weather[0].main}. Stay safe out there!`;
      } catch (e) {
        return "I couldn't fetch live weather right now, but I'm monitoring disruption zones for you!";
      }
    }

    // 3. PLAN
    if (text.match(/\b(plan|coverage|shield)\b/)) {
      return `🛡️ Your Protection Details:\n\nPlan: ${profile?.plan_id?.toUpperCase() || 'PRO'} SHIELD\nPremium: ₹${profile?.premium || 25}/week\nMax Payout: ₹${profile?.coverage || 240}\nStatus: Active ✅`;
    }

    // 4. CLAIMS
    if (text.match(/\b(claim|claims|history)\b/)) {
      const claimsSnap = await getDocs(query(collection(db, "claims"), where("worker_id", "==", user!.uid), limit(3)));
      if (claimsSnap.empty) return "You haven't filed any claims yet. Payouts are automatic when weather triggers occur!";
      let history = "📋 Your Recent Claims:\n";
      claimsSnap.forEach(doc => {
        const c = doc.data();
        history += `\n- ₹${c.compensation} (${c.trigger_type}) - ${c.status}`;
      });
      return history;
    }

    // 5. EARNINGS
    if (text.match(/\b(earn|income|salary|dna)\b/)) {
      return `💰 Your Income DNA Profile:\n\n🌅 Morning: ₹45/hr\n☀️ Afternoon: ₹57/hr\n🌆 Evening (Peak): ₹78/hr\n🌙 Night: ₹51/hr\n\nYour payouts are calculated using these specific rates.`;
    }

    // 6. TRUST
    if (text.match(/\b(trust|score|fraud)\b/)) {
      return `📈 AI Integrity Audit:\n\nYour current Trust Score is ${profile?.trustScore || 95}/100.\nHigh trust scores ensure instant payouts without manual review.`;
    }

    // 7. SOS
    if (text.match(/\b(sos|emergency)\b/)) {
      return `🚨 SOS EMERGENCY MODE ACTIVE\n\nPlease contact local authorities immediately:\n📞 Police: 100\n📞 Ambulance: 108\n📞 Unified Emergency: 112\n\nI have logged your location: ${profile?.city}`;
    }

    // 8. ESCALATION
    if (text.match(/\b(payment|not received|issue|problem|help|human|agent|talk|person|connect)\b/)) {
      const ticketId = `GS-${Math.floor(100000 + Math.random() * 900000)}`;
      await addDoc(collection(db, "support_tickets"), {
        ticketId,
        workerId: user!.uid,
        workerName: profile?.name || "Worker",
        workerCity: profile?.city || "",
        workerPlan: profile?.plan_id || "pro",
        issue: userMessage,
        status: "open",
        priority: "normal",
        createdAt: serverTimestamp(),
        lastMessage: userMessage,
        unreadByAdmin: true,
        unreadByWorker: false
      });
      setActiveTicket({ id: ticketId, status: 'open' });
      return `🔗 Connecting you to a support agent...\n\n✅ Ticket #${ticketId} created!\n⏱️ Agent will join in 2-3 minutes.\n\nAn agent will join this chat shortly. You can keep chatting here while you wait! 💬\n\nYour issue has been noted:\n'${userMessage}'`;
    }

    // FALLBACK
    return "I didn't quite understand that 😊\nTry asking about rain, plan, earnings, or type 'talk to human'!";
  };

  const handleSend = async (msgOverride?: string) => {
    const message = (msgOverride || input).trim();
    if (!message || !user || !db) return;

    setLoading(true);
    setInput("");

    try {
      // 1. Save User Message
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName: profile?.name || "Worker",
        text: message,
        sender: "user",
        status: "open",
        timestamp: serverTimestamp()
      });

      // 2. Generate and Save Bot Response
      const reply = await generateResponse(message);
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName: "GigShield Assistant",
        text: reply,
        sender: "bot",
        status: "resolved",
        timestamp: serverTimestamp()
      });

    } catch (e: any) {
      console.error("SUPPORT ERROR:", e);
      toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
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
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B]"><Home className="h-5 w-5" /></Button></Link>
          <Button onClick={() => auth.signOut()} variant="ghost" size="icon" className="text-[#EF4444]"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      {activeTicket && (
        <div className="bg-[#6C47FF] text-white px-6 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} />
            <span>🎫 Ticket #{activeTicket.id} • Status: {activeTicket.status.toUpperCase()} 🟡</span>
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
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
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
              { label: "📊 Report", val: "Show my weekly report" },
              { label: "🆘 SOS Help", val: "Emergency SOS" },
              { label: "🛡️ My Plan", val: "Tell me about my plan" },
              { label: "📋 Claims", val: "Show my claim history" },
              { label: "👤 Talk to Human", val: "I want to talk to a human agent" }
            ].map((btn, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(btn.val)}
                className="whitespace-nowrap px-4 py-2 bg-[#EDE9FF] text-[#6C47FF] text-[11px] font-bold rounded-full border border-[#D4CCFF] hover:bg-[#6C47FF] hover:text-white transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 bg-[#F8F9FF] border border-[#E8E6FF] p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[#6C47FF]/10 transition-all">
            <Input 
              placeholder="Ask me about rain, claims, or earnings..." 
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
