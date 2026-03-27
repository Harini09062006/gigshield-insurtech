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

  // 🔥 WAIT UNTIL USER + DB READY
  if (isUserLoading || !user || !db) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // ✅ USER PROFILE
  const profileRef = useMemoFirebase(
    () => doc(db, "users", user.uid),
    [db, user.uid]
  );

  const { data: profile } = useDoc(profileRef);

  // ✅ SAFE QUERY
  const messagesQuery = useMemoFirebase(() => {
    return query(
      collection(db, "support_messages"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "asc"),
      limit(50)
    );
  }, [db, user.uid]);

  // ✅ SAFE useCollection
  const { data: messages } = useCollection<Message>(messagesQuery);

  // 🔽 AUTO SCROLL
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 📩 SEND MESSAGE
  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

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

      if (lowText.includes("rain") || lowText.includes("weather")) {
        const rainfall = await getCityRainfall(profile?.city || "Mumbai");
        botResponse = `Rainfall in ${profile?.city || "your city"} is ${rainfall.toFixed(1)}mm.`;
      } else if (lowText.includes("payment") || lowText.includes("problem")) {
        botResponse = "Escalated to admin. Please wait.";
        needsEscalation = true;
      } else {
        botResponse = "Please explain your issue clearly.";
      }

      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        text: botResponse,
        sender: "bot",
        status: needsEscalation ? "open" : "resolved",
        timestamp: serverTimestamp()
      });

    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">

      {/* HEADER */}
      <header className="flex justify-between p-4 border-b bg-white">
        <Link href="/dashboard" className="flex gap-2 items-center">
          <Shield />
          <span>GigShield Support</span>
        </Link>

        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button size="icon"><Home /></Button>
          </Link>
          <Button onClick={() => auth.signOut().then(() => router.push("/"))}>
            <LogOut />
          </Button>
        </div>
      </header>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {messages?.map((m, i) => (
            <motion.div key={m.id || i}>
              <div className={`p-2 rounded ${
                m.sender === "user"
                  ? "bg-purple-500 text-white ml-auto"
                  : "bg-gray-200"
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-2 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your issue..."
        />
        <Button onClick={handleSend} disabled={!input.trim() || loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>

    </div>
  );
}