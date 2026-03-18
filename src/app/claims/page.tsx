"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Zap, Home, FileText, Map as MapIcon, LogOut, Shield, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function WorkerClaims() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) router.replace("/login");
  }, [user, isUserLoading, router]);

  // CRITICAL: Query MUST be filtered by userId or worker_id to satisfy security rules
  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    
    return query(
      collection(db, "claims"), 
      where("userId", "==", user.uid), 
      limit(20)
    );
  }, [db, user?.uid]);

  const { data: claims, isLoading, error } = useCollection(claimsQuery);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (isUserLoading || !mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[#EEEEFF] flex flex-col font-body">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B]"><Home className="h-6 w-6" /></Button></Link>
          <Link href="/claims"><Button variant="ghost" size="icon" className="text-[#6C47FF] bg-[#EDE9FF]"><FileText className="h-6 w-6" /></Button></Link>
          <Link href="/heatmap"><Button variant="ghost" size="icon" className="text-[#64748B]"><MapIcon className="h-6 w-6" /></Button></Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-[#EF4444]"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="space-y-8 p-6 lg:p-10 max-w-5xl mx-auto w-full">
        <header>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">My Protection Claims</h1>
          <p className="text-[#64748B] text-sm mt-1">Review your parametric payout history and automated verification status</p>
        </header>

        {error ? (
          <div className="py-20 text-center border-2 border-dashed border-[#EF4444]/30 rounded-2xl bg-white/50 space-y-4">
            <AlertCircle className="h-12 w-12 text-[#EF4444] mx-auto" />
            <h3 className="text-lg font-bold text-[#1A1A2E]">Access Denied</h3>
            <p className="text-[#64748B] text-sm max-w-xs mx-auto">
              Unable to load claims. Please ensure your account is properly registered and you have an active plan.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white/50 rounded-2xl animate-pulse border border-[#E8E6FF]" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {claims && claims.length > 0 ? (
              claims.map((claim) => (
                <Card key={claim.id} className="border-[#E8E6FF] shadow-card overflow-hidden bg-white rounded-2xl">
                  <CardHeader className="bg-[#DCFCE7]/30 px-6 py-4 flex flex-row items-center justify-between border-b border-[#E8E6FF]/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                      <span className="font-bold text-[#1A1A2E] text-sm">Trigger: {claim.trigger_description || "Severe Weather"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-bold">
                      <Calendar className="h-4 w-4" />
                      {claim.created_at?.seconds ? format(new Date(claim.created_at.seconds * 1000), "dd MMM, HH:mm") : "Just now"}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 grid md:grid-cols-[1fr,240px]">
                    <div className="p-6 bg-[#EDE9FF]/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase">Claim ID: <span className="text-[#1A1A2E]">#{claim.claim_number || claim.id.slice(0, 6)}</span></span>
                        <Badge className="bg-[#6C47FF]/10 text-[#6C47FF] border-none text-[9px] font-bold uppercase tracking-wider">Income DNA Verified</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>DNA Time Slot</span><span className="font-bold">{claim.dna_time_slot}</span></div>
                        <div className="flex justify-between"><span>Registered Rate</span><span className="font-bold">₹{claim.registered_rate}/hr</span></div>
                        <div className="flex justify-between bg-white p-2 rounded-lg border border-[#6C47FF]/20 text-[#6C47FF] font-bold">
                          <span>DNA Hourly Rate</span><span>₹{claim.dna_hourly_rate}/hr</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[#E8E6FF] text-lg font-bold text-[#6C47FF]">
                          <span>Compensation</span><span>₹{claim.compensation}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-l border-[#E8E6FF]/50 flex flex-col items-center justify-center bg-white text-center">
                      <div className="text-3xl font-bold text-[#6C47FF] mb-1">₹{claim.compensation}</div>
                      <Badge className="bg-[#DCFCE7] text-[#22C55E] border-none font-bold">✓ PAID INSTANTLY</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-[#E8E6FF] rounded-2xl bg-white/50">
                <Zap className="h-12 w-12 text-[#94A3B8] mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-[#1A1A2E]">No claims yet</h3>
                <p className="text-[#64748B] text-sm mt-2">Automated payouts will appear here when weather triggers occur.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </motion.div>
  );
}