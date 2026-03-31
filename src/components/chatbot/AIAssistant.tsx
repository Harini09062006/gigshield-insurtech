"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Brain, 
  Shield, 
  MessageSquare,
  Headphones,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useFirestore, 
  useUser, 
  useDoc,
  useMemoFirebase
} from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  doc, 
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * HYBRID AI SUPPORT ASSISTANT
 * Detects payment issues and escalates to human admins in real-time using 'chats' collection.
 */
export function AIAssistant({ open, onOpenChange }: AIAssistantProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileRef = useMemoFirebase(
    () => (db && user?.uid ? doc(db, "users", user.uid) : null),
    [db, user?.uid]
  );
  const { data: profile } = useDoc(profileRef);

  // CHATBOT REAL-TIME LISTENER (MANDATORY)
  useEffect(() => {
    if (!db || !user?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [db, user?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const isPaymentIssue = (msg: string) => {
    const keywords = ["payment", "salary", "not paid", "money", "transaction", "upi", "refund", "earnings"];
    return keywords.some(k => msg.toLowerCase().includes(k));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || !db) return;

    setInput("");
    
    try {
      setLoading(true);

      const isEscalation = isPaymentIssue(text);

      // 1. Save User Message to 'chats'
      await addDoc(collection(db, "chats"), {
        userId: user.uid,
        userName: profile?.name || "Worker",
        workerCity: profile?.city || "Unknown",
        workerPlan: profile?.plan_id || "pro",
        message: text,
        sender: "user",
        type: isEscalation ? "payment_issue" : "normal",
        status: isEscalation ? "pending_admin" : "ai_handled",
        createdAt: serverTimestamp()
      });

      // 2. Handle AI if not escalated
      if (!isEscalation) {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });

        if (res.ok) {
          const data = await res.json();
          await addDoc(collection(db, "chats"), {
            userId: user.uid,
            message: data?.reply || "I'm here to help!",
            sender: "ai",
            type: "normal",
            status: "resolved",
            createdAt: serverTimestamp()
          });
        }
      } else {
        // Confirmation message for escalation
        await addDoc(collection(db, "chats"), {
          userId: user.uid,
          message: "Payment issue detected. Your issue has been forwarded to our support team for priority review. Please wait here for a response.",
          sender: "ai",
          type: "payment_issue",
          status: "escalated",
          createdAt: serverTimestamp()
        });
      }
      
    } catch (err: any) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

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
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[#1A1A2E] leading-none">Support Center</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#64748B]">Hybrid AI + Live Support Online</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-10 w-10 rounded-full hover:bg-red-50 text-[#EF4444]">
              <X size={20} />
            </Button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Brain size={48} className="text-[#6C47FF]" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#1A1A2E]">How can we help you?</h3>
                <p className="text-sm text-[#64748B] max-sm">Ask about claims, risk, or payment issues.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <motion.div 
                  key={m.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                      m.sender === "user" ? "bg-[#6C47FF] text-white" : 
                      m.sender === 'admin' ? "bg-amber-500 text-white" :
                      "bg-white border border-[#E8E6FF] text-[#6C47FF]"
                    }`}>
                      {m.sender === "user" ? <User size={14} /> : (m.sender === 'admin' ? <Shield size={14} /> : <Bot size={14} />)}
                    </div>
                    <div className={`p-3 rounded-2xl shadow-card transition-all relative ${
                      m.sender === "user" ? "bg-[#6C47FF] text-white rounded-tr-none" : "bg-white text-[#1A1A2E] rounded-tl-none border border-[#E8E6FF]"
                    }`}>
                      {m.sender === 'admin' && (
                        <Badge className="absolute -top-2 -left-2 bg-amber-500 text-white border-none text-[7px] font-black uppercase px-1.5 h-4 flex items-center gap-1 shadow-sm">
                          <Shield size={8} /> Admin Support
                        </Badge>
                      )}
                      <p className="text-sm font-medium leading-relaxed">{m.message}</p>
                      
                      <div className="flex items-center justify-between mt-2 gap-4">
                        <div className={`text-[8px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 ${m.sender === 'user' ? 'text-white' : 'text-[#64748B]'}`}>
                          {m.sender} • {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), "HH:mm") : 'Syncing...'}
                        </div>
                        {m.type === 'payment_issue' && (
                          <div className={`text-[7px] font-black uppercase flex items-center gap-1 ${m.status === 'resolved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {m.status === 'resolved' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                            {m.status?.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-3 items-center animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-white border border-[#E8E6FF] flex items-center justify-center text-[#6C47FF]"><Bot size={14} /></div>
                  <div className="bg-white border border-[#E8E6FF] p-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-3 w-3 animate-spin text-[#6C47FF]" /><span className="text-[10px] font-bold text-[#64748B]">Processing...</span>
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
              <Button onClick={handleSend} disabled={!input.trim() || loading} className="h-10 w-10 rounded-xl bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn shrink-0">
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}