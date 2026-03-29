"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Brain, 
  Shield, 
  MessageSquare,
  Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase,
  useDoc
} from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  limit 
} from "firebase/firestore";
import { getBotResponse } from "@/services/supportBotService";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * AI SUPPORT ASSISTANT - CORE CONNECTION COMPONENT
 * Handles real-time messaging sync between Worker and Admin Portal.
 */
export function AIAssistant({ open, onOpenChange }: AIAssistantProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [input, setInput] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Get user profile for identity mapping
  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // 2. REAL-TIME LISTENER: Syncs both User, Bot, and Admin replies
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "support_messages"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "asc"),
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: messages } = useCollection(messagesQuery);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isBotThinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || !db) return;

    setInput("");
    
    // 3. FIRESTORE WRITE: Store User Message / Support Ticket
    // Includes requested fields: userId, message, timestamp, status
    await addDoc(collection(db, "support_messages"), {
      userId: user.uid,
      userName: profile?.name || "Worker",
      text, // Internal UI field
      message: text, // Requested field
      sender: "user",
      status: "pending", // Initial status for admin visibility
      timestamp: serverTimestamp()
    });

    // 4. BOT INTELLIGENCE & AUTO-ESCALATION
    setIsBotThinking(true);
    setTimeout(async () => {
      const { botResponse, needsEscalation } = getBotResponse(text, profile?.name);
      
      // Save Bot Response / Escalation Notification
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName: "GigShield Assistant",
        text: botResponse,
        message: botResponse,
        sender: "bot",
        status: needsEscalation ? "pending" : "resolved",
        timestamp: serverTimestamp()
      });
      
      setIsBotThinking(false);
    }, 800);
  };

  // Determine if a human admin has engaged or if issue is escalated
  const isEscalated = messages?.some(m => m.sender === 'admin' || m.status === 'pending' || m.status === 'in-progress');

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#EEEEFF]/95 backdrop-blur-xl flex flex-col font-body"
      >
        <header className="px-6 py-4 bg-white border-b border-[#E8E6FF] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
            <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
              <Shield className="text-white h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[#1A1A2E] leading-tight">AI Support Assistant</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isEscalated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#64748B]">
                  {isEscalated ? "Live Monitoring / Admin Connected" : "AI Assistant Ready"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-10 w-10 rounded-full hover:bg-red-50 text-[#EF4444]">
              <X size={20} />
            </Button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
          {messages?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Brain size={48} className="text-[#6C47FF]" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#1A1A2E]">How can I help you today?</h3>
                <p className="text-sm text-[#64748B] max-w-sm">Ask about claims, rain risk, or your Income DNA profile.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages?.map((m, i) => (
                <motion.div 
                  key={m.id || i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                      m.sender === "user" ? "bg-[#6C47FF] text-white" : 
                      m.sender === 'admin' ? "bg-amber-500 text-white" :
                      "bg-white border border-[#E8E6FF] text-[#6C47FF]"
                    }`}>
                      {m.sender === "user" ? <User size={14} /> : (m.sender === 'admin' ? <Headphones size={14} /> : <Bot size={14} />)}
                    </div>
                    <div className={`p-3 rounded-2xl shadow-card transition-all ${
                      m.sender === "user" ? "bg-[#6C47FF] text-white rounded-tr-none" : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                      <div className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-60 flex items-center gap-2 ${m.sender === 'user' ? 'text-white' : 'text-[#64748B]'}`}>
                        {m.sender} • {m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), "HH:mm") : 'Syncing...'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isBotThinking && (
                <div className="flex gap-3 items-center animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-white border border-[#E8E6FF] flex items-center justify-center text-[#6C47FF]"><Bot size={14} /></div>
                  <div className="bg-white border border-[#E8E6FF] p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-[#6C47FF]" /><span className="text-[10px] font-bold text-[#64748B]">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-[#E8E6FF] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-center bg-[#F8F9FF] border border-[#E8E6FF] p-2 rounded-2xl focus-within:border-[#6C47FF] transition-all">
              <Input 
                placeholder="Describe your issue..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm font-medium h-10 px-4"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isBotThinking} className="h-10 w-10 rounded-xl bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0">
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #D4CCFF; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6C47FF; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
