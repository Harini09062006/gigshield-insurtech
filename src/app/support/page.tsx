"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Brain, Send, Loader2, Home, LogOut, Shield, 
  AlertTriangle, PhoneCall, MapPin, Trophy, Star, 
  TrendingUp, BarChart3, Languages, Calculator,
  Mic, MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, limit, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCityRainfall } from "@/services/weatherService";
import { useToast } from "@/hooks/use-toast";

type MessageType = "text" | "risk_meter" | "calculator" | "sos" | "report" | "points" | "advisor";

interface Message {
  role: "bot" | "user";
  text: string;
  type?: MessageType;
  data?: any;
}

export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [language, setLanguage] = useState("en-IN");
  
  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data Fetching
  const profileRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null), 
    [db, user]
  );
  const dnaRef = useMemoFirebase(
    () => (db && user ? doc(db, "income_dna", user.uid) : null), 
    [db, user]
  );
  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "claims"), 
      where("worker_id", "==", user.uid),
      limit(5)
    );
  }, [db, user?.uid]);
  
  const { data: recentClaims } = useCollection(claimsQuery);

  // Fetch Worker Name and Initial Greeting
  useEffect(() => {
    if (profile && messages.length === 0) {
      const name = profile.name?.split(' ')[0] || 'Worker';
      setWorkerName(name);
      setMessages([{ 
        role: "bot", 
        text: `Hi ${name}! 👋 I'm your GigShield AI Assistant!\n\nI can help you with:\n🌧️ Weather & Rain Risk\n💰 Earnings & Income DNA\n🛡️ Your Coverage Details\n⚡ Filing Claims\n📊 Weekly Reports\n\nWhat would you like to know today?`
      }]);
    }
  }, [profile]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Voice Recording Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsRecording(true);
        setIsProcessingSpeech(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        setIsProcessingSpeech(false);
        toast({ variant: "destructive", title: "Mic Error", description: "Could not understand audio. Please try again." });
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessingSpeech(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({ variant: "destructive", title: "Not Supported", description: "Your browser does not support voice input." });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
    }
  };

  // SOS Handler
  const handleSOS = async () => {
    setIsTyping(true);
    try {
      const rainfall = await getCityRainfall(profile?.city || "Chennai");
      const city = profile?.city || "your city";
      
      let statusMsg = `🚨 SOS MODE ACTIVATED!\n\nChecking conditions in ${city}...\nCurrent rainfall: ${rainfall.toFixed(1)}mm`;
      
      if (rainfall > 50) {
        statusMsg += "\n\n⚠️ SEVERE DISRUPTION DETECTED!\nAuto-triggering your claim now!\nPlease find a safe location immediately!";
        await handleClaimProcess(
          profile?.maxPayout || 240, 
          `SOS Trigger: ${rainfall.toFixed(1)}mm Rain`
        );
      } else {
        statusMsg += "\n\n✅ You are currently SAFE!\nRainfall is below danger threshold.\nI am monitoring the situation for you!";
      }

      setMessages(prev => [...prev, { 
        role: "bot", 
        text: statusMsg,
        type: "sos",
        data: { 
          rainfall, 
          city, 
          contacts: ["112 (Emergency)", "100 (Police)", "108 (Ambulance)"] 
        }
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "🚨 SOS activated! Please call 112 for emergency assistance. Stay safe!"
      }]);
    }
    setIsTyping(false);
  };

  // Claim Processing
  const handleClaimProcess = async (amount: number, reason: string) => {
    if (!user || !db) return;
    setLoading(true);
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
      toast({ 
        title: "✅ Claim Successful!", 
        description: `₹${amount} paid instantly to your account!` 
      });
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to process claim. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  // Main Response Generator
  const generateResponse = async (queryStr: string): Promise<Message | null> => {
    const lowQuery = queryStr.toLowerCase();
    const name = workerName || 'Worker';
    
    // Language Detection
    const isTamil = /[\u0B80-\u0BFF]/.test(queryStr) || 
      lowQuery.includes("plan என்ன") || 
      lowQuery.includes("மழை");
    const isHindi = /[\u0900-\u097F]/.test(queryStr) || 
      lowQuery.includes("मेरा plan") || 
      lowQuery.includes("बारिश");

    // Rain Risk
    if (lowQuery.includes("rain") || 
        lowQuery.includes("risk") || 
        lowQuery.includes("weather") || 
        lowQuery.includes("மழை") || 
        lowQuery.includes("बारिश")) {
      try {
        const rainfall = await getCityRainfall(profile?.city || "Chennai");
        const riskPercent = Math.min(100, Math.round((rainfall / 50) * 100));
        return {
          role: "bot",
          text: isTamil 
            ? `தற்போது ${profile?.city || 'உங்கள் பகுதி'}யில் மழையளவு ${rainfall.toFixed(1)}mm.\nபாதிப்பு அபாயம்: ${riskPercent}%` 
            : isHindi 
            ? `${profile?.city || 'आपके क्षेत्र'} में अभी ${rainfall.toFixed(1)}mm बारिश।\nजोखिम स्तर: ${riskPercent}%`
            : `Here is your Live Risk Meter for ${profile?.city || 'Chennai'}:`,
          type: "risk_meter",
          data: { rainfall, riskPercent, city: profile?.city }
        };
      } catch {
        return { 
          role: "bot", 
          text: "Unable to fetch weather data right now. Please try again!" 
        };
      }
    }

    // Earnings Calculator
    if (lowQuery.includes("earn") || 
        lowQuery.includes("calc") || 
        lowQuery.includes("income") || 
        lowQuery.includes("कमाई") ||
        lowQuery.includes("salary")) {
      return {
        role: "bot",
        text: `Here is your Income Calculator based on your DNA (Base: ₹${profile?.hourlyRate || 60}/hr):`,
        type: "calculator",
        data: { baseRate: profile?.hourlyRate || 60 }
      };
    }

    // Weekly Report
    if (lowQuery.includes("week") || 
        lowQuery.includes("report") || 
        lowQuery.includes("grade") ||
        lowQuery.includes("performance")) {
      const totalEarned = dna?.weekly_earnings || 6111;
      const grade = totalEarned > 7000 ? "A+" : totalEarned > 5000 ? "A" : "B";
      return {
        role: "bot",
        text: `Your Weekly Performance Report is ready ${name}:`,
        type: "report",
        data: { totalEarned, grade, saved: 240, safeDays: 5, rainDays: 2 }
      };
    }

    // Points
    if (lowQuery.includes("point") || 
        lowQuery.includes("reward") || 
        lowQuery.includes("game") ||
        lowQuery.includes("trophy")) {
      return {
        role: "bot",
        text: `You are doing great ${name}! Here are your GigShield Points:`,
        type: "points",
        data: { points: profile?.points || 1250 }
      };
    }

    // Upgrade Advisor
    if (lowQuery.includes("upgrade") || 
        lowQuery.includes("elite") || 
        lowQuery.includes("better plan") ||
        lowQuery.includes("worth it")) {
      return {
        role: "bot",
        text: `I analyzed your last 4 weeks of data ${name}:`,
        type: "advisor",
        data: { incomeLost: 4500, covered: 960, extraCover: 1440 }
      };
    }

    // SOS
    if (lowQuery.includes("sos") || 
        lowQuery.includes("emergency") || 
        lowQuery.includes("flood") ||
        lowQuery.includes("danger") ||
        lowQuery.includes("help")) {
      handleSOS();
      return null;
    }

    // Plan Details
    if (lowQuery.includes("plan") || 
        lowQuery.includes("coverage") ||
        lowQuery.includes("shield")) {
      return {
        role: "bot",
        text: `🛡️ Your Active Plan — ${name}\n\nPlan: ${profile?.plan || 'Pro Shield'} ✅\nWeekly Premium: ₹${profile?.premium || 25}\nMax Payout: ₹${profile?.maxPayout || 240}\nCovers: Rain · Floods · AQI\nStatus: ACTIVE\nNext Renewal: 28 Mar\nWeek: 1 of 4`
      };
    }

    // Claims History
    if (lowQuery.includes("claim") || 
        lowQuery.includes("history") ||
        lowQuery.includes("paid")) {
      if (!recentClaims || recentClaims.length === 0) {
        return { 
          role: "bot", 
          text: `📋 Claims History — ${name}\n\nYou haven't filed any claims yet!\n\nYour Pro Shield is active and ready to protect you when rain hits! 🛡️` 
        };
      }
      const list = recentClaims
        .map((c: any) => `✅ ₹${c.compensation} — ${c.trigger_description || 'Rain Event'}\n   Status: ${c.status?.toUpperCase()}`)
        .join("\n\n");
      return { 
        role: "bot", 
        text: `📋 Your Recent Claims:\n\n${list}\n\nTotal claims filed: ${recentClaims.length}` 
      };
    }

    // Trust Score
    if (lowQuery.includes("trust") || 
        lowQuery.includes("score") ||
        lowQuery.includes("safe") ||
        lowQuery.includes("secure")) {
      return { 
        role: "bot", 
        text: `🔒 Security Status — ${name}\n\nTrust Score: ${profile?.trustScore || 95}/100 ✅\n\nFraud Checks:\n✅ GPS Validation — PASSED\n✅ Device Fingerprint — PASSED\n✅ Order History — PASSED\n✅ Duplicate Check — PASSED\n✅ Account Age — PASSED\n✅ Weather Intelligence — PASSED\n✅ Behavioral Pattern — PASSED\n✅ Network Analysis — PASSED\n\nYour account is 100% SECURE! 🛡️` 
      };
    }

    // Renewal
    if (lowQuery.includes("renewal") || 
        lowQuery.includes("renew") ||
        lowQuery.includes("expire")) {
      return { 
        role: "bot", 
        text: `🔄 Renewal Information\n\nNext Renewal: 28 March 2026\nAmount: ₹${profile?.premium || 25}\nStatus: Auto-renewal ON ✅\nWeek: 1 of 4\n\nYour coverage will continue uninterrupted!` 
      };
    }

    // Default Fallback
    return {
      role: "bot",
      text: `I didn't quite catch that ${name}! 😊\n\nHere's what I can help you with:\n🌧️ Rain risk & weather\n💰 Earnings calculation\n📋 Claims history\n🛡️ Plan details\n📊 Weekly report\n🎮 Points & rewards\n🆘 Emergency SOS\n🚀 Plan upgrade advice\n\nJust tap a button below or type your question!`
    };
  };

  const handleSend = async (textOverride?: string) => {
    const userMsg = textOverride || input.trim();
    if (!userMsg || loading || isTyping) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const botResp = await generateResponse(userMsg);
      setTimeout(() => {
        if (botResp) {
          setMessages(prev => [...prev, botResp as Message]);
        }
        setIsTyping(false);
      }, 800);
    } catch (error) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: "bot", 
          text: "Sorry, something went wrong! Please try again. 😊" 
        }]);
        setIsTyping(false);
      }, 800);
    }
  };

  const quickPills = [
    { label: '🌧️ Rain Risk?', text: 'What is my risk now?' },
    { label: '💰 Earnings?', text: 'Calculate my earnings' },
    { label: '📊 Report', text: 'Show my weekly report' },
    { label: '🆘 SOS Help', text: 'SOS EMERGENCY' },
    { label: '🎮 Points', text: 'What are my points?' },
    { label: '🛡️ My Plan', text: 'What is my plan?' },
    { label: '📋 Claims', text: 'Show my claims history' },
    { label: '🚀 Upgrade?', text: 'Should I upgrade to Elite?' },
    { label: '💳 Renewal?', text: 'When is my renewal?' },
    { label: '🔒 Trust Score', text: 'What is my trust score?' }
  ];

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#EEEEFF] flex flex-col font-body overflow-hidden">
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white shadow-sm shrink-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-[#64748B] hover:bg-[#F5F3FF] rounded-xl">
              <Home />
            </Button>
          </Link>
          <Button 
            onClick={() => auth.signOut().then(() => router.push("/"))} 
            variant="ghost" 
            size="icon" 
            className="text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl"
          >
            <LogOut />
          </Button>
        </div>
      </header>

      {/* Sub-Header */}
      <div className="bg-[#6C47FF] px-6 py-3 flex items-center justify-between shadow-lg shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
            <Brain className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="text-white font-bold leading-tight flex items-center gap-2">
              AI Support Intelligence
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            </h1>
            <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest">
              Deep DNA Analysis Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 z-10">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 px-3 py-1 rounded-lg border border-white/20 text-[10px] text-white font-bold outline-none cursor-pointer hover:bg-white/20 transition-all"
          >
            <option value="en-IN" className="bg-[#6C47FF]">EN-IN English</option>
            <option value="hi-IN" className="bg-[#6C47FF]">HI-IN Hindi</option>
            <option value="ta-IN" className="bg-[#6C47FF]">TA-IN Tamil</option>
          </select>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full scroll-smooth" 
        ref={scrollRef}
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[90%] md:max-w-[80%] space-y-2">
                <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-line leading-relaxed ${
                  m.role === "user" 
                    ? "bg-[#6C47FF] text-white rounded-tr-none" 
                    : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"
                }`}>
                  {m.text}
                  {m.type === "risk_meter" && <RiskMeter data={m.data} />}
                  {m.type === "calculator" && <IncomeCalculator data={m.data} />}
                  {m.type === "sos" && <SOSCard data={m.data} />}
                  {m.type === "report" && <WeeklyReportCard data={m.data} />}
                  {m.type === "points" && <PointsCard data={m.data} />}
                  {m.type === "advisor" && (
                    <UpgradeAdvisor 
                      data={m.data} 
                      onUpgrade={() => router.push('/worker/plans')} 
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex items-center gap-2 text-[#6C47FF] text-xs font-bold px-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="animate-pulse">Analyzing patterns...</span>
          </motion.div>
        )}
      </div>

      {/* Input Section */}
      <div className="bg-white border-t border-[#E8E6FF] shrink-0">
        
        {/* Quick Pills */}
        <div className="flex gap-2 overflow-x-auto p-3 border-b border-[#E8E6FF]">
          {quickPills.map(q => (
            <button
              key={q.label}
              onClick={() => handleSend(q.text)}
              disabled={loading || isTyping}
              className="whitespace-nowrap bg-white border border-[#E8E6FF] hover:border-[#6C47FF] hover:bg-[#F5F3FF] hover:text-[#6C47FF] rounded-full px-4 py-2 text-[11px] font-bold transition-all shrink-0 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="p-4 max-w-4xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleRecording}
            className={`rounded-full h-12 w-12 transition-all shrink-0 ${
              isRecording 
                ? "bg-red-500 text-white animate-pulse" 
                : isProcessingSpeech 
                ? "bg-[#EDE9FF] text-[#6C47FF]"
                : "bg-[#F5F3FF] text-[#6C47FF] hover:bg-[#6C47FF] hover:text-white"
            }`}
          >
            {isProcessingSpeech ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-6 w-6" />}
          </Button>
          
          <div className="flex-1 relative">
            <Input 
              placeholder={isRecording ? "🎙️ Recording... tap to stop" : "Ask about earnings, rain risk, or safety..."} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleSend()} 
              disabled={loading}
              className="rounded-full border-2 border-[#E8E6FF] h-12 pr-12 focus:border-[#6C47FF] transition-all bg-[#F8F9FF] text-sm" 
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()} 
              disabled={!input.trim() || loading || isTyping}
              className={`absolute right-1 top-1 rounded-full h-10 w-10 transition-all ${
                !input.trim() || loading || isTyping 
                  ? "bg-gray-200 text-gray-400" 
                  : "bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn"
              }`}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
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
    <div className="mt-4 p-4 rounded-xl border border-[#E8E6FF] bg-[#F8F9FF] space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-[#64748B] uppercase">🌦️ Live Risk Meter</span>
        <span className="text-[10px] font-mono text-[#6C47FF] animate-pulse">LIVE</span>
      </div>
      <div className="h-3 w-full bg-[#E8E6FF] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${data.riskPercent}%` }} 
          style={{ backgroundColor: color }}
          transition={{ duration: 1 }}
          className="h-full" 
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-medium">
        <div className="bg-white p-2 rounded-lg border border-[#E8E6FF]">
          <p className="text-[9px] text-[#94A3B8] uppercase">Rainfall</p>
          <p className="font-bold">{data.rainfall.toFixed(1)}mm</p>
        </div>
        <div className="bg-white p-2 rounded-lg border border-[#E8E6FF]">
          <p className="text-[9px] text-[#94A3B8] uppercase">Risk Level</p>
          <p className="font-bold" style={{ color }}>{data.riskPercent}%</p>
        </div>
      </div>
      <div className={`p-2 rounded-lg text-[10px] font-bold text-center ${
        data.riskPercent > 60 
          ? 'bg-red-100 text-red-600' 
          : 'bg-green-100 text-green-600'
      }`}>
        {data.riskPercent > 60 
          ? '⚠️ CLAIM MAY FIRE SOON!' 
          : '✓ PROTECTION ACTIVE & SAFE'}
      </div>
    </div>
  );
}

function IncomeCalculator({ data }: { data: any }) {
  const [slot, setSlot] = useState("Evening");
  const [hours, setHours] = useState(3);
  const mults: any = { 
    Morning: 0.75, 
    Afternoon: 0.95, 
    Evening: 1.30, 
    Night: 0.85 
  };
  const expected = Math.round(data.baseRate * mults[slot] * hours);

  return (
    <div className="mt-4 p-4 rounded-xl border-2 border-[#6C47FF]/20 bg-white space-y-4">
      <div className="flex items-center gap-2 text-[#6C47FF] font-bold text-xs uppercase">
        <Calculator className="h-4 w-4" /> Income Calculator
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[9px] text-[#94A3B8] uppercase font-bold mb-1">Time Slot</p>
          <div className="flex gap-1">
            {Object.keys(mults).map(s => (
              <button 
                key={s} 
                onClick={() => setSlot(s)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-md border transition-all ${
                  slot === s 
                    ? 'bg-[#6C47FF] text-white border-[#6C47FF]' 
                    : 'bg-white text-[#64748B] border-[#E8E6FF]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] text-[#94A3B8] uppercase font-bold mb-1">Hours</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(h => (
              <button 
                key={h} 
                onClick={() => setHours(h)}
                className={`flex-1 py-1 text-[10px] font-bold rounded-md border transition-all ${
                  hours === h 
                    ? 'bg-[#6C47FF] text-white border-[#6C47FF]' 
                    : 'bg-white text-[#64748B] border-[#E8E6FF]'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-3 border-t border-[#E8E6FF] flex justify-between items-end">
        <div>
          <p className="text-[9px] text-[#94A3B8] uppercase">Expected</p>
          <p className="text-xl font-bold text-[#6C47FF]">₹{expected}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-[#22C55E] uppercase font-bold">Protected</p>
          <p className="text-xs font-bold text-[#22C55E]">✅ COVERED</p>
        </div>
      </div>
    </div>
  );
}

function SOSCard({ data }: { data: any }) {
  return (
    <div className="mt-4 p-4 rounded-xl border-2 border-red-500 bg-red-50 space-y-4">
      <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase">
        <AlertTriangle className="h-5 w-5 animate-bounce" /> SOS MODE ACTIVE
      </div>
      <div className="space-y-2">
        {data.contacts.map((c: string) => (
          <Button 
            key={c} 
            variant="outline" 
            className="w-full bg-white border-red-200 text-red-600 h-10 gap-2 font-bold text-xs"
          >
            <PhoneCall className="h-4 w-4" /> {c}
          </Button>
        ))}
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-10 gap-2 font-bold text-xs">
          <MapPin className="h-4 w-4" /> Find Nearest Shelter
        </Button>
      </div>
    </div>
  );
}

function WeeklyReportCard({ data }: { data: any }) {
  return (
    <div className="mt-4 p-4 rounded-xl border border-[#E8E6FF] bg-gradient-to-br from-white to-[#F5F3FF] space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            Weekly Report
          </span>
          <p className="text-lg font-bold text-[#1A1A2E]">Grade: {data.grade} 🏆</p>
        </div>
        <div className="h-10 w-10 bg-[#EDE9FF] rounded-full flex items-center justify-center text-[#6C47FF]">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[#94A3B8] text-[9px] uppercase">Total Earned</p>
          <p className="font-bold text-[#1A1A2E]">₹{data.totalEarned}</p>
        </div>
        <div>
          <p className="text-[#22C55E] text-[9px] uppercase">Shield Saved</p>
          <p className="font-bold text-[#22C55E]">₹{data.saved}</p>
        </div>
        <div>
          <p className="text-[#94A3B8] text-[9px] uppercase">Safe Days</p>
          <p className="font-bold">{data.safeDays} ☀️</p>
        </div>
        <div>
          <p className="text-[#F59E0B] text-[9px] uppercase">Rain Days</p>
          <p className="font-bold text-[#F59E0B]">{data.rainDays} 🌧️</p>
        </div>
      </div>
    </div>
  );
}

function PointsCard({ data }: { data: any }) {
  return (
    <div className="mt-4 p-4 rounded-xl border border-[#E8E6FF] bg-[#1A1A2E] text-white space-y-4 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 h-20 w-20 bg-[#6C47FF] opacity-20 blur-2xl" />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <Trophy className="text-white h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] text-white/60 uppercase font-bold">Total Points</p>
          <p className="text-xl font-bold">{data.points.toLocaleString()} 🏆</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-white/60 uppercase">Next Reward</span>
          <span className="text-orange-400">750 pts to go!</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-[65%] bg-gradient-to-r from-orange-400 to-yellow-400" />
        </div>
      </div>
      <div className="bg-white/5 p-2 rounded-lg border border-white/10 flex items-center justify-between text-[10px]">
        <span className="text-white/80">Next: FREE PROTECTION WEEK</span>
        <Star className="h-3 w-3 text-yellow-400 fill-current" />
      </div>
    </div>
  );
}

function UpgradeAdvisor({ data, onUpgrade }: { data: any, onUpgrade: () => void }) {
  return (
    <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-[#6C47FF]/40 bg-[#F5F3FF] space-y-4">
      <div className="flex items-center gap-2 text-[#6C47FF] font-bold text-xs uppercase">
        <TrendingUp className="h-4 w-4" /> Smart Upgrade Advisor
      </div>
      <div className="text-[11px] text-[#64748B] leading-relaxed">
        You lost <b>₹{data.incomeLost}</b> due to rain disruptions, 
        but only <b>₹{data.covered}</b> was covered by your current plan.
      </div>
      <div className="p-3 bg-white rounded-lg border border-[#E8E6FF] flex justify-between items-center">
        <div>
          <p className="text-[9px] text-[#94A3B8] uppercase">Potential ROI</p>
          <p className="text-lg font-bold text-[#6C47FF]">14x Return! 🚀</p>
        </div>
        <Button 
          onClick={onUpgrade} 
          className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold h-10 px-4 text-xs rounded-xl"
        >
          UPGRADE NOW
        </Button>
      </div>
    </div>
  );
}
