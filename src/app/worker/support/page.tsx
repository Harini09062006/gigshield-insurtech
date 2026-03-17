"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Mic, MicOff, Globe, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/firebase";

interface Message {
  role: "bot" | "user";
  text: string;
}

export default function SupportPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: `Hi ${user?.displayName || 'Worker'}! How can I help you today?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (msg?: string) => {
    const userMsg = msg || input.trim();
    if (!userMsg) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    // AI Response Logic (Mock)
    setTimeout(() => {
      let response = "I'm here to help with your GigShield coverage. You can ask about claims, rain risk, or your Income DNA.";
      
      const lowMsg = userMsg.toLowerCase();
      if (lowMsg.includes("rain")) {
        response = "Heavy rain (45mm) is predicted for South Mumbai today. Your disruption risk is at 65%. Your Pro Shield plan will cover any income loss automatically.";
      } else if (lowMsg.includes("claim")) {
        response = "Your latest claim (#00388) for ₹156 was paid successfully. It was triggered by an evening peak rainfall event.";
      } else if (lowMsg.includes("dna")) {
        response = "Your Income DNA shows an Evening Peak multiplier of 1.3×. This means you earn most between 5-9 PM, and your payouts are calculated at ₹78/hr during this slot.";
      } else if (lowMsg.includes("renewal")) {
        response = "Your Pro Shield policy is active and will auto-renew on Nov 19, 2024. The weekly premium is ₹1.";
      }

      setMessages(prev => [...prev, { role: "bot", text: response }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-bg-page flex flex-col">
      <header className="bg-primary px-6 py-4 flex items-center justify-between shadow-lg">
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
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full" ref={scrollRef}>
        <div className="flex flex-col items-center py-10 opacity-50">
          <div className="h-16 w-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-headline font-bold text-lg text-heading">How can I help you?</h2>
          <p className="text-sm text-body">Type, tap 🎤 to speak, or pick a quick question</p>
        </div>

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
              "Show my Income DNA profile",
              "When is my next renewal?"
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