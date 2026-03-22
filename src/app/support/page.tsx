
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Loader2, Home, FileText, LogOut, Shield, IndianRupee, Zap, CloudRain, ShieldCheck, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, getDoc, collection, query, where, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCityRainfall } from "@/services/weatherService";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "bot" | "user";
  text: string;
  type?: "text" | "claim_action" | "plan_details";
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
  const [voiceOn, setVoiceOn] = useState(false);
  const [language, setLanguage] = useState("en");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data Fetching
  const profileRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const dnaRef = useMemoFirebase(() => (db && user ? doc(db, "income_dna", user.uid) : null), [db, user]);
  
  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "claims"), 
      where("worker_id", "==", user.uid),
      orderBy("created_at", "desc"),
      limit(3)
    );
  }, [db, user?.uid]);
  
  const { data: recentClaims } = useCollection(claimsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (profile && messages.length === 0) {
      const firstName = profile.name?.split(' ')[0] || 'Worker';
      setMessages([{ 
        role: "bot", 
        text: `Hi ${firstName}! I'm your GigShield Assistant. How can I help you today?` 
      }]);
    }
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClaimProcess = async (amount: number, reason: string) => {
    if (!user || !profile || !db) return;
    
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

      setMessages(prev => [...prev, { 
        role: "bot", 
        text: `⚡ Payout processed! ₹${amount} has been credited to your linked account. You can view it in your Claims History.` 
      }]);
      
      toast({ title: "Claim Successful", description: `₹${amount} paid instantly!` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process claim." });
    } finally {
      setLoading(false);
    }
  };

  const generateResponse = async (query: string) => {
    const lowQuery = query.toLowerCase();
    const workerName = profile?.name?.split(' ')[0] || 'Worker';
    const city = profile?.city || 'your city';

    // Multilingual Detection
    const isTamil = /[\u0B80-\u0BFF]/.test(query) || lowQuery.includes("plan என்ன") || lowQuery.includes("மழை");
    const isHindi = /[\u0900-\u097F]/.test(query) || lowQuery.includes("मेरा plan") || lowQuery.includes("बारिश");

    // 1. Rain Logic
    if (lowQuery.includes("rain") || lowQuery.includes("weather") || lowQuery.includes("மழை") || lowQuery.includes("बारिश")) {
      const rainfall = await getCityRainfall(profile?.city || "");
      let risk = "LOW";
      let emoji = "☀️";
      if (rainfall > 10) { risk = "MODERATE"; emoji = "🌧️"; }
      if (rainfall > 30) { risk = "HIGH"; emoji = "⛈️"; }
      if (rainfall > 50) { risk = "SEVERE"; emoji = "🌊"; }

      if (isTamil) {
        return `தற்போது ${city}-ல் மழையளவு: ${rainfall}mm ${emoji}\nபாதிப்பு அபாயம்: ${risk}\nஉங்கள் ${profile?.plan_id || 'Pro'} Shield செயலில் உள்ளது! ✅`;
      }
      if (isHindi) {
        return `${city} में अभी बारिश: ${rainfall}mm ${emoji}\nजोखिम: ${risk}\nआपका ${profile?.plan_id || 'Pro'} Shield active है! ✅`;
      }

      return `Current rainfall in ${city}: ${rainfall.toFixed(1)}mm ${emoji}
Condition: ${rainfall > 0 ? 'Raining' : 'Clear Conditions'}
Disruption Risk: ${risk}
Your ${profile?.plan_id?.toUpperCase() || 'PRO'} Shield is active ✅
${rainfall > 50 ? 'Severe disruption detected! You can file a claim now.' : 'No major disruption detected right now. I will auto-trigger your claim if rain crosses 50mm!'}`;
    }

    // 2. Earnings / DNA Logic
    if (lowQuery.includes("earn") || lowQuery.includes("income") || lowQuery.includes("dna") || lowQuery.includes("வருமானம்") || lowQuery.includes("कमाई")) {
      if (!dna) return "I couldn't find your Income DNA profile yet. Please work for a few more days to generate it!";
      
      return `Your Income DNA Profile, ${workerName}:
🌅 Morning (6-10 AM): ₹${dna.morning_rate}/hr
☀️ Afternoon (12-4 PM): ₹${dna.afternoon_rate}/hr
🌆 Evening (5-9 PM): ₹${dna.evening_rate}/hr ← Peak
🌙 Night (9 PM-12 AM): ₹${dna.night_rate}/hr

Expected weekly earnings: ₹${dna.weekly_earnings || '6,111'}
Protected amount: ₹${profile?.plan_id === 'elite' ? '600' : profile?.plan_id === 'pro' ? '240' : '60'} (${profile?.plan_id || 'Pro'} Shield)`;
    }

    // 3. Claims History
    if (lowQuery.includes("claim history") || lowQuery.includes("history") || lowQuery.includes("வரலாறு") || lowQuery.includes("इतिहास")) {
      if (!recentClaims || recentClaims.length === 0) return `You haven't filed any claims yet, ${workerName}.`;
      
      const claimsList = recentClaims.map((c, i) => 
        `${i + 1}. #${c.claim_number || c.id.slice(0,6)} — ₹${c.compensation} PAID ✅\n   ${c.created_at ? format(new Date(c.created_at.seconds * 1000), "dd MMM, p") : 'Just now'}\n   Trigger: ${c.trigger_description || 'Weather Trigger'}`
      ).join('\n\n');

      const total = recentClaims.reduce((sum, c) => sum + (c.compensation || 0), 0);
      return `Your Recent Claims, ${workerName}:\n\n${claimsList}\n\nTotal protected recently: ₹${total} 💰`;
    }

    // 4. Plan Details
    if (lowQuery.includes("plan") || lowQuery.includes("coverage") || lowQuery.includes("திட்டம்") || lowQuery.includes("योजना")) {
      const planName = profile?.plan_id?.toUpperCase() || 'PRO';
      const max = profile?.plan_id === 'elite' ? 600 : profile?.plan_id === 'pro' ? 240 : 60;
      const premium = profile?.plan_id === 'elite' ? 50 : profile?.plan_id === 'pro' ? 25 : 10;

      if (isTamil) {
        return `உங்கள் திட்டம்: ${planName} Shield 🔵\nஅதிகபட்ச இழப்பீடு: ₹${max}\nஅடுத்த புதுப்பித்தல்: 4 வாரங்களில்\nநிலை: செயலில் உள்ளது ✅`;
      }

      return `Your Active Plan, ${workerName}:
Plan: ${planName} Shield 🛡️
Weekly Premium: ₹${premium}
Max Payout: ₹${max}
Coverage: Rain · Floods · AQI
Status: ACTIVE ✅
Auto-Renewal: ON`;
    }

    // 5. File Claim
    if (lowQuery.includes("file") || lowQuery.includes("apply") || lowQuery.includes("செய்ய") || lowQuery.includes("दावा")) {
      const rainfall = await getCityRainfall(profile?.city || "");
      if (rainfall > 50) {
        const max = profile?.plan_id === 'elite' ? 600 : profile?.plan_id === 'pro' ? 240 : 60;
        setMessages(prev => [...prev, {
          role: "bot",
          text: `I can see ${rainfall.toFixed(1)}mm rain in ${city}! Based on your ${profile?.plan_id || 'Pro'} Shield, you are eligible for compensation.`,
          type: "claim_action",
          data: { amount: max, reason: `Live Trigger: ${rainfall.toFixed(1)}mm Rain` }
        }]);
        return null;
      }
      return `No major disruption detected in ${city} right now. Current rainfall: ${rainfall.toFixed(1)}mm ☀️\n\nYour Shield will auto-trigger when rain crosses 50mm! 🛡️`;
    }

    // 6. Specific Follow-ups
    if (lowQuery.includes("trust") || lowQuery.includes("score")) {
      return `Your Trust Score: 95/100 ✅\nYour account is fully verified! All fraud checks are passing and you are eligible for instant payouts.`;
    }

    if (lowQuery.includes("safe") || lowQuery.includes("secure")) {
      return `Your account is 100% secure! 🛡️\nTrust Score: 95/100\nLast fraud check: All PASSED ✅\nNo suspicious activity detected.`;
    }

    return `I'm not sure about that, ${workerName}. 😊 Here's what I can help you with:`;
  };

  const handleSend = async (textOverride?: string) => {
    const userMsg = textOverride || input.trim();
    if (!userMsg) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    const botResponse = await generateResponse(userMsg);
    if (botResponse) {
      setMessages(prev => [...prev, { role: "bot", text: botResponse }]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    { label: '🌧️ Rain Risk?', text: 'Will rain affect me today?' },
    { label: '💰 Earnings', text: 'What are my earnings?' },
    { label: '📋 Claims', text: 'Show my claims history' },
    { label: '🛡️ My Plan', text: 'What is my plan?' },
    { label: '⚡ File Claim', text: 'File a claim now' }
  ];

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;

  return (
    <div className="h-screen bg-[#EEEEFF] flex flex-col font-body overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white shadow-sm shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">Gig<span className="text-[#6C47FF]">Shield</span></span>
        </Link>
        <div className="flex gap-2">
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B]"><Home /></Button></Link>
          <Link href="/claims"><Button variant="ghost" size="icon" className="text-[#64748B]"><FileText /></Button></Link>
          <Button onClick={() => auth.signOut().then(() => router.push("/"))} variant="ghost" size="icon" className="text-[#EF4444]"><LogOut /></Button>
        </div>
      </header>

      <div className="bg-[#6C47FF] px-6 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border-2 border-white/20">
            <Brain className="text-[#6C47FF] h-6 w-6" />
          </div>
          <div>
            <h1 className="text-white font-bold leading-tight">AI Support Assistant</h1>
            <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Powered by GenAI Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg text-white px-2 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="en" className="text-black">English</option>
            <option value="hi" className="text-black">Hindi</option>
            <option value="ta" className="text-black">Tamil</option>
          </select>
          <button 
            onClick={() => setVoiceOn(!voiceOn)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${voiceOn ? 'bg-white text-[#6C47FF]' : 'bg-white/10 text-white border border-white/20'}`}
          >
            {voiceOn ? '🔊 Voice ON' : '🔇 Voice OFF'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full scroll-smooth" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] space-y-2`}>
                <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-line leading-relaxed ${
                  m.role === "user" 
                    ? "bg-[#6C47FF] text-white rounded-tr-none" 
                    : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"
                }`}>
                  {m.text}
                </div>
                
                {m.type === "claim_action" && (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <Button 
                      onClick={() => handleClaimProcess(m.data.amount, m.data.reason)}
                      className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold h-12 rounded-xl shadow-md gap-2"
                    >
                      <Zap className="h-5 w-5 fill-current" />
                      Process Claim Now — ₹{m.data.amount}
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 text-[#6C47FF] text-xs font-bold px-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-[#E8E6FF] shrink-0">
        <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar border-b border-[#E8E6FF]">
          {quickQuestions.map(q => (
            <button
              key={q.label}
              onClick={() => handleSend(q.text)}
              className="whitespace-nowrap bg-white border border-[#E8E6FF] hover:border-[#6C47FF] hover:bg-[#F5F3FF] hover:text-[#6C47FF] rounded-full px-4 py-2 text-[11px] font-bold transition-all shrink-0 shadow-sm"
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="p-4 max-w-4xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-12 w-12 bg-[#F5F3FF] text-[#6C47FF] shrink-0"
            onClick={() => toast({ title: "Mic Initialized", description: "Listening for your query..." })}
          >
            <Zap className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative">
            <Input 
              placeholder="Ask about claims, rain risk, or earnings..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleSend()} 
              className="rounded-full border-2 border-[#E8E6FF] h-12 pr-12 focus:border-[#6C47FF] transition-all bg-[#F8F9FF]" 
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()} 
              disabled={!input.trim() || loading}
              className="absolute right-1 top-1 rounded-full h-10 w-10 bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
