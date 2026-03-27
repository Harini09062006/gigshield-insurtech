
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Home, LogOut, Shield } from "lucide-react";
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
  orderBy
} from "firebase/firestore";
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

  // ✅ CRITICAL: All hooks must be called at the top level before any early returns.
  // We use stable references even if data is not yet available.
  
  const profileRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user?.uid]
  );

  const { data: profile } = useDoc(profileRef);

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

  // 🔽 AUTO SCROLL EFFECT
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 🔥 SAFE EARLY RETURN: Now that all hooks are registered, we can return the loading state.
  if (isUserLoading || !user || !db) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || !db) return;

    setLoading(true);
    setInput("");

    try {
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName: profile?.name || "Worker",
        text,
        sender: "user",
        status: "open",
        timestamp: serverTimestamp()
      });

      let botResponse = "";
      let needsEscalation = false;
      const lowText = text.toLowerCase();

      if (lowText.includes("rain") || lowText.includes("weather") || lowText.includes("risk")) {
        const rainfall = await getCityRainfall(profile?.city || "Mumbai");
        botResponse = `Current rainfall in ${profile?.city || "your city"} is ${rainfall.toFixed(1)}mm. Your protection coverage is active.`;
      } else if (lowText.includes("payment") || lowText.includes("problem") || lowText.includes("claim") || lowText.includes("not received")) {
        botResponse = "I've detected a priority issue. I'm connecting you to a support agent now. Please hold on.";
        needsEscalation = true;
      } else {
        botResponse = "I'm the GigShield Assistant. I can help with weather risk, claims info, or escalate you to a human agent if you have a specific problem.";
      }

      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        text: botResponse,
        sender: "bot",
        status: needsEscalation ? "open" : "resolved",
        timestamp: serverTimestamp()
      });

    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please check your connection."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#EEEEFF] font-body">
      <header className="flex justify-between items-center px-6 py-4 border-b border-[#E8E6FF] bg-white sticky top-0 z-50">
        <Link href="/dashboard" className="flex gap-2 items-center">
          <div className="h-8 w-8 bg-[#6C47FF] rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-headline font-bold text-[#1A1A2E]">GigShield Support</span>
        </Link>

        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-[#64748B] hover:text-[#6C47FF]">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-[#EF4444] hover:bg-[#FEE2E2]" onClick={() => auth.signOut().then(() => router.push("/"))}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <Shield className="h-12 w-12 text-[#6C47FF]" />
            <div>
              <p className="font-bold text-[#1A1A2E]">How can we help today?</p>
              <p className="text-xs text-[#64748B]">Ask about weather risk or payment issues</p>
            </div>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages?.map((m, i) => (
            <motion.div 
              key={m.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm ${
                m.sender === "user"
                  ? "bg-[#6C47FF] text-white rounded-tr-none"
                  : "bg-white border border-[#E8E6FF] text-[#1A1A2E] rounded-tl-none"
              }`}>
                <p className="leading-relaxed">{m.text}</p>
                <div className={`text-[10px] mt-1 font-bold uppercase tracking-widest opacity-50 ${m.sender === "user" ? "text-white" : "text-[#64748B]"}`}>
                  {m.sender}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#6C47FF] italic animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> GigShield is thinking...
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-[#E8E6FF]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your issue..."
            className="h-12 rounded-xl border-[#E8E6FF] focus:border-[#6C47FF] transition-all bg-[#F8F9FF]"
            disabled={loading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || loading}
            className="h-12 w-12 rounded-xl bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
