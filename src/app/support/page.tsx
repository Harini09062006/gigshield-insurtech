
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Mic, MicOff, Globe, Loader2, User, Home, FileText, Map as MapIcon, LogOut, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuth } from "@/firebase";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface Message {
  role: "bot" | "user";
  text: string;
}

export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setMessages([{ role: "bot", text: `Hi ${user.displayName || 'Worker'}! How can I help you today?` }]);
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const handleSend = async (msg?: string) => {
    const userMsg = msg || input.trim();
    if (!userMsg) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    setTimeout(() => {
      let response = "I'm here to help with your GigShield coverage. You can ask about claims, rain risk, or your Income DNA.";
      const lowMsg = userMsg.toLowerCase();
      if (lowMsg.includes("rain")) response = "Heavy rain (65mm) is predicted for South Mumbai today. Your disruption risk is at 65%. Your Pro Shield plan will cover any income loss automatically.";
      else if (lowMsg.includes("claim")) response = "Your parametric claims are automated. You'll receive a payout directly to your account when weather thresholds are met.";
      else if (lowMsg.includes("dna")) response = "Your Income DNA uses your avg hourly rate of ₹60 and applies peak multipliers (up to 1.3x) to ensure you get full compensation.";
      
      setMessages(prev => [...prev, { role: "bot", text: response }]);
      setLoading(false);
    }, 1000);
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-bg-page"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (!user) return null;

  return (
    <div className="h-screen bg-bg-page flex flex-col font-body overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-heading">
            Gig<span className="text-primary">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className={pathname === "/dashboard" ? "text-primary bg-primary-light" : "text-body"}>
              <Home className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/claims">
            <Button variant="ghost" size="icon" className={pathname === "/claims" ? "text-primary bg-primary-light" : "text-body"}>
              <FileText className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/heatmap">
            <Button variant="ghost" size="icon" className={pathname === "/heatmap" ? "text-primary bg-primary-light" : "text-body"}>
              <MapIcon className="h-6 w-6" />
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-danger hover:bg-danger-bg">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <div className="bg-primary px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-white font-bold leading-none">AI Support Assistant</h1>
            <p className="text-white/70 text-[10px] mt-1">Online · Ask anything about your coverage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="text-white h-8 text-xs font-bold gap-1 hover:bg-white/10">
            <Globe className="h-4 w-4" /> IN English ▼
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setVoiceOn(!voiceOn)}
            className={`text-white h-8 text-xs font-bold gap-1 hover:bg-white/10 ${voiceOn ? "bg-white/20" : ""}`}
          >
            {voiceOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {voiceOn ? "Voice ON" : "Voice OFF"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-primary text-white" : "bg-white border border-border text-primary"}`}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${m.role === "user" ? "bg-primary text-white rounded-tr-none" : "bg-white text-heading rounded-tl-none border border-border"}`}>
                  {m.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-2 items-center text-primary italic text-xs font-bold">
            <Loader2 className="h-3 w-3 animate-spin" /> AI Assistant is thinking...
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              "Will rain affect my earnings today?",
              "What is my current claim status?",
              "How much compensation will I get?",
              "Show my Income DNA profile"
            ].map((q, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-4 py-2 bg-primary-light text-primary text-[11px] font-bold rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-primary-light text-primary">
              <Mic className="h-6 w-6" />
            </Button>
            <Input 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-12 rounded-full border-2 border-border px-6 focus:border-primary transition-all"
            />
            <Button size="icon" onClick={() => handleSend()} disabled={!input.trim()} className="rounded-full h-12 w-12 bg-primary shadow-btn">
              <Send className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
