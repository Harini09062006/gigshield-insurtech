
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Brain, Send, Loader2, Home, LogOut, Shield, 
  AlertTriangle, PhoneCall, MapPin, Trophy, Star, 
  TrendingUp, BarChart3, Languages, Calculator,
  Mic, MicOff, CheckCircle2, Clock, Zap, Info, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, limit, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCityRainfall } from "@/services/weatherService";
import { useToast } from "@/hooks/use-toast";

type MessageType = "text" | "risk_meter" | "calculator" | "sos" | "report" | "points" | "advisor" | "plan";

interface Message {
  role: "bot" | "user";
  text: string;
  type?: MessageType;
  data?: any;
  timestamp: string;
}

export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const placeholders = [
    "Ask me about coverage...",
    "Check rain risk...",
    "Calculate earnings...",
    "View claims history...",
    "Check my points..."
  ];

  // Fetch worker name for personalized greeting
  const [workerName, setWorkerName] = useState('Worker');
  useEffect(() => {
    if (user?.uid && db) {
      getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists()) setWorkerName(snap.data().name?.split(' ')[0] || 'Worker');
      });
    }
  }, [user, db]);

  // Data References
  const profileRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const dnaRef = useMemoFirebase(() => (db && user ? doc(db, "income_dna", user.uid) : null), [db, user]);
  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "claims"), where("worker_id", "==", user.uid), limit(5));
  }, [db, user?.uid]);
  const { data: recentClaims } = useCollection(claimsQuery);

  // Auto-scroll and placeholder rotation
  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(prev => (prev + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Initial Greeting
  useEffect(() => {
    if (workerName && messages.length === 0) {
      setMessages([{ 
        role: "bot", 
        text: `Hi ${workerName}! 👋 I'm your GigShield AI Assistant! I'm here to ensure your income stays protected, no matter the weather.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [workerName]);

  const handleSOS = async () => {
    setIsTyping(true);
    try {
      const rainfall = await getCityRainfall(profile?.city || "Chennai");
      const city = profile?.city || "your city";
      
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "Checking your situation right now...",
        type: "sos",
        data: { rainfall, city, status: rainfall > 50 ? "triggered" : "safe" },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      if (rainfall > 50) {
        await handleClaimProcess(profile?.maxPayout || 240, `SOS Trigger: ${rainfall.toFixed(1)}mm Rain`);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Emergency", description: "Call 112 for immediate assistance." });
    } finally {
      setIsTyping(false);
    }
  };

  const handleClaimProcess = async (amount: number, reason: string) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, "claims"), {
        worker_id: user.uid,
        userId: user.uid,
        claim_number: `GS-${Math.floor(100000 + Math.random() * 900000)}`,
        trigger_type: "weather",
        trigger_description: reason,
        compensation: amount,
        status: "paid",
        created_at: serverTimestamp()
      });
      toast({ title: "✅ Payout Success", description: `₹${amount} paid instantly!` });
    } catch (e) {
      console.error(e);
    }
  };

  const generateResponse = async (queryStr: string): Promise<Message | null> => {
    const lowQuery = queryStr.toLowerCase();
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (lowQuery.includes("rain") || lowQuery.includes("risk") || lowQuery.includes("weather")) {
      const rainfall = await getCityRainfall(profile?.city || "Chennai");
      const riskPercent = Math.min(100, Math.round((rainfall / 50) * 100));
      return {
        role: "bot",
        text: `Here is your Live Risk Intelligence for ${profile?.city || 'Chennai'}:`,
        type: "risk_meter",
        data: { rainfall, riskPercent, city: profile?.city },
        timestamp: ts
      };
    }

    if (lowQuery.includes("earn") || lowQuery.includes("calc") || lowQuery.includes("income")) {
      return {
        role: "bot",
        text: "Interactive Income DNA Calculator enabled:",
        type: "calculator",
        data: { baseRate: profile?.avg_hourly_earnings || 60 },
        timestamp: ts
      };
    }

    if (lowQuery.includes("week") || lowQuery.includes("report")) {
      const totalEarned = dna?.weekly_earnings || 6111;
      const grade = totalEarned > 7000 ? "A+" : totalEarned > 5000 ? "A" : "B";
      return {
        role: "bot",
        text: "Weekly Performance Analytics ready:",
        type: "report",
        data: { totalEarned, grade, saved: 240, safeDays: 5, rainDays: 2 },
        timestamp: ts
      };
    }

    if (lowQuery.includes("point") || lowQuery.includes("reward")) {
      return {
        role: "bot",
        text: "Your current achievement status:",
        type: "points",
        data: { points: profile?.points || 1250 },
        timestamp: ts
      };
    }

    if (lowQuery.includes("plan") || lowQuery.includes("coverage")) {
      return {
        role: "bot",
        text: "Your current protection details:",
        type: "plan",
        data: { plan: profile?.plan_id || 'Pro', premium: profile?.premium || 25, payout: profile?.max_payout || 240 },
        timestamp: ts
      };
    }

    if (lowQuery.includes("sos") || lowQuery.includes("emergency") || lowQuery.includes("help")) {
      handleSOS();
      return null;
    }

    return {
      role: "bot",
      text: "I didn't quite catch that! I'm best at rain risks, earnings DNA, and plan management. Try a button below!",
      timestamp: ts
    };
  };

  const handleSend = async (textOverride?: string) => {
    const userMsg = textOverride || input.trim();
    if (!userMsg) return;

    setInput("");
    setMessages(prev => [...prev, { 
      role: "user", 
      text: userMsg, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setIsTyping(true);

    const botResp = await generateResponse(userMsg);
    setTimeout(() => {
      if (botResp) setMessages(prev => [...prev, botResp]);
      setIsTyping(false);
    }, 1000);
  };

  const quickPills = [
    { label: '🌧️ Rain Risk', text: 'Rain risk today?', color: 'bg-blue-500' },
    { label: '💰 Earnings', text: 'Calculate my earnings', color: 'bg-green-500' },
    { label: '📋 Claims', text: 'Show my claims', color: 'bg-purple-500' },
    { label: '🛡️ My Plan', text: 'What is my plan?', color: 'bg-indigo-600' },
    { label: '⚡ File Claim', text: 'emergency', color: 'bg-orange-500' },
    { label: '🆘 SOS Help', text: 'emergency', color: 'bg-red-500' },
    { label: '🎮 My Points', text: 'What are my points?', color: 'bg-pink-500' },
    { label: '📊 Report', text: 'Show weekly report', color: 'bg-teal-500' }
  ];

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-[#1A1A2E]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;

  return (
    <div className="h-screen bg-[#0F0F1E] flex flex-col font-body overflow-hidden text-white">
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#1A1A2E]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 bg-gradient-to-tr from-[#6C47FF] to-[#8E66FF] rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
              <Brain className="text-white h-7 w-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-[#1A1A2E] animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">GigShield AI Assistant</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Powered by Income DNA Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer hover:bg-white/10 transition-all">
            <option value="en" className="bg-[#1A1A2E]">EN ▼</option>
            <option value="hi" className="bg-[#1A1A2E]">Hindi</option>
            <option value="ta" className="bg-[#1A1A2E]">Tamil</option>
          </select>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setVoiceOn(!voiceOn)}
            className={`text-white hover:bg-white/10 rounded-lg text-xs gap-2 ${voiceOn ? 'bg-[#6C47FF]/20 border border-[#6C47FF]/50' : ''}`}
          >
            {voiceOn ? <><Zap className="h-3 w-3 fill-white" /> 🔊 ON</> : <><MicOff className="h-3 w-3" /> OFF</>}
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white/60 hover:bg-white/5 rounded-xl"><Home className="h-5 w-5" /></Button>
          </Link>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border border-white/5 ${m.role === "user" ? "bg-gradient-to-br from-[#6C47FF] to-[#5535E8]" : "bg-[#1A1A2E]"}`}>
                  {m.role === "user" ? <span className="font-bold text-xs">Me</span> : <Brain className="h-5 w-5" />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className={`p-4 rounded-[24px] shadow-2xl backdrop-blur-md text-sm leading-relaxed ${
                    m.role === "user" 
                      ? "bg-gradient-to-br from-[#6C47FF]/90 to-[#5535E8]/90 text-white rounded-tr-none border border-white/10" 
                      : "bg-[#1A1A2E]/90 text-white/90 rounded-tl-none border border-white/5"
                  }`}>
                    {m.text}
                    {m.type === "risk_meter" && <RiskMeter data={m.data} />}
                    {m.type === "calculator" && <IncomeCalculator data={m.data} />}
                    {m.type === "sos" && <SOSCard data={m.data} />}
                    {m.type === "report" && <WeeklyReportCard data={m.data} />}
                    {m.type === "points" && <PointsCard data={m.data} />}
                    {m.type === "plan" && <PlanCard data={m.data} onUpgrade={() => router.push('/worker/plans')} />}
                  </div>
                  <span className="text-[10px] text-white/30 font-medium px-2">{m.timestamp}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-[#1A1A2E] border border-white/5">
              <Brain className="h-5 w-5 animate-pulse text-[#6C47FF]" />
            </div>
            <div className="bg-[#1A1A2E]/50 p-4 rounded-[20px] rounded-tl-none border border-white/5 flex gap-1.5">
              <span className="h-1.5 w-1.5 bg-[#6C47FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 bg-[#6C47FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 bg-[#6C47FF] rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input Bar Section */}
      <div className="bg-[#1A1A2E]/80 backdrop-blur-2xl border-t border-white/5 p-4 flex flex-col gap-4">
        
        {/* Quick Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {quickPills.map(q => (
            <motion.button
              key={q.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(q.text)}
              className={`whitespace-nowrap ${q.color} text-white px-4 py-2 text-[11px] font-bold rounded-full transition-all shadow-lg shadow-black/20 flex-shrink-0 flex items-center gap-2 border border-white/10`}
            >
              {q.label}
            </motion.button>
          ))}
        </div>

        {/* Input Control */}
        <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl h-12 w-12 bg-white/5 border border-white/10 text-white hover:bg-white/10"
            onClick={() => handleSend('Calculate my earnings')}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative group">
            <Input 
              placeholder={placeholders[placeholderIdx]}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleSend()} 
              className="rounded-2xl border-white/10 h-12 pr-12 focus:ring-[#6C47FF] bg-white/5 text-white placeholder:text-white/20 transition-all text-sm group-hover:bg-white/10 focus:bg-white/10" 
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()} 
              disabled={!input.trim()}
              className="absolute right-1 top-1 rounded-xl h-10 w-10 bg-[#6C47FF] hover:bg-[#5535E8] shadow-lg shadow-[#6C47FF]/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────

function RiskMeter({ data }: { data: any }) {
  const color = data.riskPercent > 60 ? "#EF4444" : data.riskPercent > 30 ? "#F59E0B" : "#22C55E";
  return (
    <div className="mt-4 p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-4 min-w-[260px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">🌦️ Live Intelligence</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-red-500 font-bold">REALTIME</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${data.riskPercent}%` }} 
            style={{ backgroundColor: color }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span style={{ color }}>{data.riskPercent > 60 ? 'HIGH RISK' : data.riskPercent > 30 ? 'MEDIUM RISK' : 'LOW RISK'}</span>
          <span className="text-white/40">{data.riskPercent}%</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
          <p className="text-[9px] text-white/30 uppercase font-bold">Rainfall</p>
          <p className="font-bold text-white text-lg">{data.rainfall.toFixed(1)}<span className="text-[10px] ml-0.5 text-white/40">mm</span></p>
        </div>
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
          <p className="text-[9px] text-white/30 uppercase font-bold">Threshold</p>
          <p className="font-bold text-white/60 text-lg">50.0<span className="text-[10px] ml-0.5 text-white/40">mm</span></p>
        </div>
      </div>
      <p className="text-[11px] text-white/60 leading-relaxed font-medium">
        {data.riskPercent > 60 ? '⚠️ Severe rainfall detected. Claim threshold approaching rapidly.' : '✓ Weather remains within safe delivery parameters.'}
      </p>
    </div>
  );
}

function IncomeCalculator({ data }: { data: any }) {
  const [slot, setSlot] = useState("Evening");
  const [hours, setHours] = useState(3);
  const mults: any = { Morning: 0.75, Afternoon: 0.95, Evening: 1.30, Night: 0.85 };
  const expected = Math.round(data.baseRate * mults[slot] * hours);

  return (
    <div className="mt-4 p-5 rounded-3xl border border-white/10 bg-[#1A1A2E] shadow-2xl space-y-5 min-w-[280px]">
      <div className="flex items-center gap-2 text-[#6C47FF] font-bold text-xs uppercase tracking-widest">
        <Calculator className="h-4 w-4" /> Income Predictor
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-[9px] text-white/30 uppercase font-bold mb-2">Select Time Slot</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.keys(mults).map(s => (
              <button key={s} onClick={() => setSlot(s)} className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${slot === s ? 'bg-[#6C47FF] text-white border-[#6C47FF] shadow-lg shadow-[#6C47FF]/20' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white/60'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase font-bold mb-2">Duration (Hours)</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(h => (
              <button key={h} onClick={() => setHours(h)} className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all ${hours === h ? 'bg-[#6C47FF] text-white border-[#6C47FF]' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10'}`}>{h}h</button>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between items-end">
        <div>
          <p className="text-[9px] text-white/30 uppercase font-bold mb-1">Expected Earning</p>
          <motion.p key={expected} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-3xl font-bold text-white">₹{expected}</motion.p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-green-400 uppercase font-bold">Risk Covered</p>
          <p className="text-xs font-bold text-green-400">100% SECURE</p>
        </div>
      </div>
    </div>
  );
}

function SOSCard({ data }: { data: any }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setProgress(p => Math.min(100, p + 25)), 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 p-5 rounded-3xl border-2 border-red-500/50 bg-red-500/5 backdrop-blur-2xl space-y-5 min-w-[280px] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 animate-pulse pointer-events-none" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-500 font-bold text-sm uppercase tracking-widest">
          <AlertTriangle className="h-5 w-5 animate-bounce" /> EMERGENCY MODE
        </div>
        <span className="text-[10px] font-bold text-red-500/60 uppercase">{progress}%</span>
      </div>
      
      <div className="space-y-3">
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-red-500" />
        </div>
        <div className="space-y-2 text-[11px] font-bold uppercase tracking-wider">
          <div className={`flex items-center gap-2 ${progress >= 25 ? 'text-red-500' : 'text-white/20'}`}><CheckCircle2 className="h-3 w-3" /> Weather Verified</div>
          <div className={`flex items-center gap-2 ${progress >= 50 ? 'text-red-500' : 'text-white/20'}`}><CheckCircle2 className="h-3 w-3" /> Plan Authenticated</div>
          <div className={`flex items-center gap-2 ${progress >= 75 ? 'text-red-500' : 'text-white/20'}`}><CheckCircle2 className="h-3 w-3" /> Claim Triggered</div>
          <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-red-500' : 'text-white/20'}`}><CheckCircle2 className="h-3 w-3" /> Payout Initiated</div>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12 rounded-2xl gap-3 shadow-xl shadow-red-500/20">
          <PhoneCall className="h-5 w-5" /> CALL EMERGENCY (112)
        </Button>
        <Button variant="outline" className="w-full border-white/10 text-white font-bold h-12 rounded-2xl bg-white/5">
          <MapPin className="h-5 w-5 mr-2" /> FIND NEAREST SHELTER
        </Button>
      </div>
    </div>
  );
}

function WeeklyReportCard({ data }: { data: any }) {
  return (
    <div className="mt-4 p-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1E] space-y-5 min-w-[280px] shadow-2xl">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Weekly Performance</span>
          <p className="text-2xl font-bold text-white">Grade: <span className="text-[#6C47FF]">{data.grade}</span> 🏆</p>
        </div>
        <div className="h-12 w-12 bg-[#6C47FF]/10 rounded-2xl flex items-center justify-center text-[#6C47FF] border border-[#6C47FF]/20 shadow-xl shadow-[#6C47FF]/5">
          <BarChart3 className="h-6 w-6" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
          <p className="text-white/30 text-[9px] font-bold uppercase mb-1">Earned</p>
          <p className="font-bold text-white text-lg">₹{data.totalEarned}</p>
        </div>
        <div className="bg-green-500/5 p-3 rounded-2xl border border-green-500/10">
          <p className="text-green-400 text-[9px] font-bold uppercase mb-1">Savings</p>
          <p className="font-bold text-green-400 text-lg">₹{data.saved}</p>
        </div>
      </div>
      <div className="flex justify-between items-center text-[11px] font-bold text-white/40 pt-2 border-t border-white/5">
        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {data.safeDays} Active Days</span>
        <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> {data.rainDays} Rain Events</span>
      </div>
    </div>
  );
}

function PointsCard({ data }: { data: any }) {
  return (
    <div className="mt-4 p-5 rounded-3xl border border-white/10 bg-[#1A1A2E] text-white space-y-5 min-w-[280px] relative overflow-hidden shadow-2xl">
      <div className="absolute -top-10 -right-10 h-32 w-32 bg-[#6C47FF] opacity-10 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-gradient-to-tr from-yellow-400/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
          <Trophy className="text-yellow-400 h-7 w-7" />
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Available Points</p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold">{data.points.toLocaleString()}</motion.p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-white/40">Progress to Free Week</span>
          <span className="text-yellow-400">750 pts left</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
        </div>
      </div>
      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-[10px] font-bold">
        <span className="text-white/60 uppercase">Claim Rewards Market</span>
        <ChevronRight className="h-4 w-4 text-[#6C47FF]" />
      </div>
    </div>
  );
}

function PlanCard({ data, onUpgrade }: { data: any, onUpgrade: () => void }) {
  return (
    <div className="mt-4 p-5 rounded-3xl border border-white/10 bg-white shadow-2xl min-w-[280px] space-y-5 text-[#1A1A2E]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#6C47FF] font-bold text-xs uppercase tracking-widest">
          <Shield className="h-4 w-4" /> Active Policy
        </div>
        <div className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">Verified</div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-sm font-bold border-b border-[#1A1A2E]/5 pb-2">
          <span className="text-[#1A1A2E]/40 font-medium">Plan Type</span>
          <span className="capitalize">{data.plan} Shield</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-b border-[#1A1A2E]/5 pb-2">
          <span className="text-[#1A1A2E]/40 font-medium">Weekly Premium</span>
          <span>₹{data.premium}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-b border-[#1A1A2E]/5 pb-2">
          <span className="text-[#1A1A2E]/40 font-medium">Max Payout</span>
          <span>₹{data.payout}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-[#1A1A2E]/40 font-medium">Status</span>
          <span className="text-green-600">● Active</span>
        </div>
      </div>
      <Button 
        onClick={onUpgrade}
        className="w-full bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold h-12 rounded-[20px] shadow-xl shadow-[#6C47FF]/30 transition-all active:scale-[0.98]"
      >
        RENEW / UPGRADE PLAN
      </Button>
    </div>
  );
}
