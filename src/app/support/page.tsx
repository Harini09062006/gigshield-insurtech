"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Mic, Globe, Loader2, User, Home, FileText, Map as MapIcon, LogOut, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuth } from "@/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  role: "bot" | "user";
  text: string;
}

export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setMessages([{ role: "bot", text: `Hi ${user.displayName || 'Worker'}! How can I help you today with your coverage?` }]);
    }
  }, [user]);

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

    setTimeout(() => {
      let response = "I'm here to help with your GigShield coverage. Ask about claims or rain risk.";
      const lowMsg = userMsg.toLowerCase();
      if (lowMsg.includes("rain")) response = "Rain prediction: 65mm for South Mumbai. Risk is HIGH. Your Pro Shield plan covers this automatically.";
      else if (lowMsg.includes("claim")) response = "Parametric claims are automated. You'll see payouts in your dashboard as soon as weather triggers are confirmed.";
      
      setMessages(prev => [...prev, { role: "bot", text: response }]);
      setLoading(false);
    }, 800);
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;

  return (
    <div className="h-screen bg-[#EEEEFF] flex flex-col font-body overflow-hidden">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">Gig<span className="text-[#6C47FF]">Shield</span></span>
        </Link>
        <div className="flex gap-4">
          <Link href="/dashboard"><Button variant="ghost" size="icon"><Home /></Button></Link>
          <Link href="/claims"><Button variant="ghost" size="icon"><FileText /></Button></Link>
          <Button onClick={() => auth.signOut().then(() => router.push("/login"))} variant="ghost" size="icon" className="text-[#EF4444]"><LogOut /></Button>
        </div>
      </header>

      <div className="bg-[#6C47FF] px-6 py-4 flex items-center gap-3 shadow-lg">
        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center"><Brain className="text-[#6C47FF]" /></div>
        <h1 className="text-white font-bold">AI Support Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-2xl text-xs font-medium shadow-sm ${m.role === "user" ? "bg-[#6C47FF] text-white rounded-tr-none" : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && <div className="text-[#6C47FF] text-[10px] font-bold animate-pulse">AI is thinking...</div>}
      </div>

      <div className="p-6 bg-white border-t border-[#E8E6FF]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input placeholder="Ask me about your coverage..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} className="rounded-full border-2 border-[#E8E6FF] h-12" />
          <Button size="icon" onClick={() => handleSend()} className="rounded-full h-12 w-12 bg-[#6C47FF] shadow-btn"><Send /></Button>
        </div>
      </div>
    </div>
  );
}