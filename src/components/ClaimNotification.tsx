"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClaimNotifProps {
  claim: {
    id: string;
    amount: number;
    trigger: string;
    timeSlot: string;
    processingTime: string;
    workerName: string;
  };
  onDismiss: () => void;
  onView: () => void;
}

/**
 * GIGSHIELD REAL-TIME CLAIM NOTIFICATION
 * Shows automated payout success with countdown timer.
 */
export function ClaimNotification({ claim, onDismiss, onView }: ClaimNotifProps) {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDismiss();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onDismiss]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="fixed top-4 right-4 z-[9999] w-[340px] bg-white border-l-4 border-l-[#6C47FF] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden font-body"
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-[#6C47FF]/10 rounded-lg flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-[#6C47FF]" />
            </div>
            <span className="text-[10px] font-black text-[#1A1A2E] uppercase tracking-[0.1em]">
              GigShield Alert!
            </span>
          </div>
          <button onClick={onDismiss} className="text-[#94A3B8] hover:text-[#1A1A2E] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[#64748B]">
            Hey <span className="font-bold text-[#1A1A2E]">{claim.workerName}</span>! We detected:
          </p>
          <p className="text-sm font-black text-[#1A1A2E] leading-tight">
            {claim.trigger}
          </p>
        </div>

        <div className="bg-[#F8F9FF] p-3 rounded-xl border border-[#E8E6FF] space-y-2">
          <p className="text-[10px] font-bold text-[#64748B]">
            Your <span className="text-[#6C47FF]">{claim.timeSlot}</span> earnings are protected by Pro Shield ✅
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#22C55E]">₹{claim.amount}</span>
            <span className="text-[10px] font-bold text-[#22C55E] uppercase">Credited</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-[#94A3B8] uppercase">Claim ID</p>
            <p className="text-[10px] font-bold text-[#1A1A2E]">#{claim.id}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-[#94A3B8] uppercase">Processing</p>
            <p className="text-[10px] font-bold text-[#6C47FF] flex items-center gap-1">
              <Zap size={10} className="fill-current" /> {claim.processingTime}
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button 
            onClick={onView}
            className="w-full bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold h-10 rounded-xl text-xs gap-2 shadow-btn"
          >
            View Claim Details <ChevronRight size={14} />
          </Button>
          <Button 
            variant="ghost" 
            onClick={onDismiss}
            className="w-full text-[#64748B] font-bold h-10 text-xs border border-[#E8E6FF] hover:bg-[#F8F9FF]"
          >
            Dismiss
          </Button>
        </div>

        <div className="flex justify-center">
          <p className="text-[9px] font-bold text-[#94A3B8] uppercase animate-pulse">
            Closing in {timeLeft}s...
          </p>
        </div>
      </div>
      <div className="h-1 bg-[#E8E6FF] w-full">
        <motion.div 
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 10, ease: "linear" }}
          className="h-full bg-[#6C47FF]"
        />
      </div>
    </motion.div>
  );
}
