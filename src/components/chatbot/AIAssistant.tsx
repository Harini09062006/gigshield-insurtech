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
  ChevronRight,
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

export function AIAssistant({ open, onOpenChange }: AIAssistantProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [input, setInput] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get user profile for personalization
  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // Real-time message synchronization
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
    
    // 1. Save User Message to Firestore
    await addDoc(collection(db, "support_messages"), {
      userId: user.uid,
      userName: profile?.name || "Worker",
      text,
      sender: "user",
      status: "open",
      timestamp: serverTimestamp()
    });

    // 2. Local Bot Intelligence
    setIsBotThinking(true);
    setTimeout(async () => {
      const { botResponse, needsEscalation } = getBotResponse(text, profile?.name);
      
      // Save Bot Response to Firestore
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        userName: "GigShield Assistant",
        text: botResponse,
        sender: "bot",
        status: needsEscalation ? "open" : "resolved",
        timestamp: serverTimestamp()
      });
      
      setIsBotThinking(false);
    }, 800);
  };

  const isEscalated = messages?.some(m => m.sender === 'admin' || m.status === 'open');

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#EEEEFF]/95 backdrop-blur-xl flex flex-col font-body"
      >
        {/* HEADER */}
        <header className="px-8 py-6 bg-white border-b border-[#E8E6FF] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#6C47FF] rounded-2xl flex items-center justify-center shadow-btn">
              <Shield className="text-white h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A2E] leading-tight">AI Support Assistant</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-2 w-2 rounded-full animate-pulse ${isEscalated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                  {isEscalated ? "Connecting to Support Agent" : "Live AI Monitoring Active"}
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
            className="h-12 w-12 rounded-full hover:bg-red-50 text-[#EF4444] transition-colors"
          >
            <X size={28} />
          </Button>
        </header>

        {/* CHAT AREA */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto w-full custom-scrollbar"
        >
          {messages?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
              <Brain size={80} className="text-[#6C47FF]" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#1A1A2E]">How can I help you today?</h3>
                <p className="text-[#64748B] max-w-sm">Ask about your claims, rain risk in your city, or your current Income DNA multiplier.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages?.map((m, i) => (
                <motion.div 
                  key={m.id || i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-4 max-w-[75%] ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      m.sender === "user" ? "bg-[#6C47FF] text-white" : 
                      m.sender === 'admin' ? "bg-amber-500 text-white" :
                      "bg-white border border-[#E8E6FF] text-[#6C47FF]"
                    }`}>
                      {m.sender === "user" ? <User size={18} /> : (m.sender === 'admin' ? <Headphones size={18} /> : <Bot size={18} />)}
                    </div>
                    
                    <div className={`p-5 rounded-2xl shadow-card transition-all ${
                      m.sender === "user" 
                        ? "bg-[#6C47FF] text-white rounded-tr-none" 
                        : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"
                    }`}>
                      <p className="text-base font-medium leading-relaxed">{m.text}</p>
                      <div className={`text-[10px] mt-3 font-black uppercase tracking-widest opacity-60 flex items-center gap-2 ${m.sender === 'user' ? 'text-white' : 'text-[#64748B]'}`}>
                        {m.sender} • {m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), "HH:mm") : 'Syncing...'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isBotThinking && (
                <div className="flex gap-4 items-center animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-white border border-[#E8E6FF] flex items-center justify-center text-[#6C47FF]">
                    <Bot size={18} />
                  </div>
                  <div className="bg-white border border-[#E8E6FF] p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#6C47FF]" />
                    <span className="text-xs font-bold text-[#64748B]">Assistant is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="p-10 bg-white border-t border-[#E8E6FF] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <div className="max-w-5xl mx-auto space-y-6">
            {!isEscalated && messages && messages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {["Check my rain risk", "When is my renewal?", "I have a payment issue", "Show my DNA peak"].map(chip => (
                  <button 
                    key={chip}
                    onClick={() => { setInput(chip); }}
                    className="whitespace-nowrap px-5 py-2.5 bg-[#F5F3FF] text-[#6C47FF] text-xs font-bold rounded-full border border-[#D4CCFF] hover:bg-[#6C47FF] hover:text-white transition-all active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-4 items-center bg-[#F8F9FF] border-2 border-[#E8E6FF] p-3 rounded-[24px] focus-within:border-[#6C47FF] transition-all">
              <Input 
                placeholder="Describe your issue or ask about your coverage..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-lg font-medium h-14 px-6"
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isBotThinking}
                className="h-14 w-14 rounded-2xl bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0 transition-all active:scale-95"
              >
                <Send size={24} />
              </Button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #D4CCFF; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6C47FF; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
