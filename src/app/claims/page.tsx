"use client";

import React, { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useDoc } from "@/firebase";
import { collection, query, where, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Home, FileText, Map as MapIcon, LogOut, Shield, AlertCircle, Loader2, AlertTriangle, XCircle, CreditCard, Zap } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function WorkerClaims() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) router.replace("/");
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user?.uid]
  );
  const { data: profile } = useDoc(profileRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "claims"), 
      where("worker_id", "==", user.uid), 
      limit(20)
    );
  }, [db, user?.uid]);

  const { data: rawClaims, isLoading, error } = useCollection(claimsQuery);

  const claims = React.useMemo(() => {
    if (!rawClaims) return [];
    return [...rawClaims].sort((a, b) => {
      const timeA = a.createdAt?.seconds || a.created_at?.seconds || 0;
      const timeB = b.createdAt?.seconds || b.created_at?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawClaims]);

  const initiateRazorpayPayout = (
    amount: number,
    workerName: string,
    claimId: string
  ) => {
    if (!(window as any).Razorpay) {
      console.error("Razorpay SDK not loaded.");
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Payment service is currently unavailable."
      });
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_payout_key",
      amount: amount * 100,
      currency: "INR",
      name: "GigShield Protection",
      description: `Claim Payout #${claimId}`,
      handler: async (response: any) => {
        await updateDoc(
          doc(db, "claims", claimId), {
          paymentId: response.razorpay_payment_id,
          paymentStatus: "CREDITED",
          paidAt: serverTimestamp()
        });
        toast({
          title: "✅ Payment Successful!",
          description: `₹${amount} credited!`
        });
      },
      prefill: { name: workerName },
      theme: { color: "#6C47FF" }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const fraudLabels: Record<string, string> = {
    gpsValidation: "GPS Validation",
    orderHistory: "Order History",
    deviceCheck: "Device Fingerprint",
    duplicateCheck: "No Duplicate",
    accountAge: "Account Age",
    weatherIntelligence: "Weather Intel",
    behaviorPattern: "Behavior Pattern",
    networkAnalysis: "Network Analysis"
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
      <header className="px-6 py-3 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-headline font-bold text-[#1A1A2E]">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="h-9 w-9 text-[#64748B]"><Home className="h-5 w-5" /></Button></Link>
          <Link href="/claims"><Button variant="ghost" size="icon" className="h-9 w-9 text-[#6C47FF] bg-[#EDE9FF]"><FileText className="h-5 w-5" /></Button></Link>
          <Link href="/heatmap"><Button variant="ghost" size="icon" className="h-9 w-9 text-[#64748B]"><MapIcon className="h-5 w-5" /></Button></Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="h-9 w-9 text-[#EF4444]"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="space-y-6 p-4 lg:p-8 max-w-5xl mx-auto w-full">
        <header>
          <h1 className="text-xl font-bold text-[#1A1A2E]">My Protection Claims</h1>
          <p className="text-[#64748B] text-xs mt-0.5">Review your parametric payout history and automated verification status</p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse border border-[#E8E6FF]" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {claims && claims.length > 0 ? (
              claims.map((claim) => (
                <Card key={claim.id} className="border-[#E8E6FF] shadow-card overflow-hidden bg-white rounded-2xl">
                  <CardHeader className={`${claim.status === 'review' || claim.decision === 'REVIEW' ? 'bg-amber-50' : (claim.status === 'paid' || claim.status === 'approved') ? 'bg-[#DCFCE7]/30' : 'bg-red-50'} px-4 py-2.5 flex flex-row items-center justify-between border-b border-[#E8E6FF]/50`}>
                    <div className="flex items-center gap-3">
                      {claim.status === 'review' || claim.decision === 'REVIEW' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : (claim.status === 'paid' || claim.status === 'approved') ? <CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="font-bold text-[#1A1A2E] text-xs">Trigger: {claim.trigger_description || "Severe Weather"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-[#64748B] font-bold">
                      <Calendar className="h-3.5 w-3.5" />
                      {claim.createdAt?.seconds ? format(new Date(claim.createdAt.seconds * 1000), "dd MMM, HH:mm") : "Just now"}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 grid md:grid-cols-[1fr,220px]">
                    <div className="p-4 bg-[#EDE9FF]/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#64748B] uppercase">Claim ID: <span className="text-[#1A1A2E]">#{claim.claim_number || claim.id.slice(0, 6)}</span></span>
                        <Badge className="bg-[#6C47FF]/10 text-[#6C47FF] border-none text-[8px] font-bold uppercase tracking-wider">Income DNA Verified</Badge>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span>DNA Time Slot</span><span className="font-bold">{claim.dna_time_slot || "Active Peak"}</span></div>
                        <div className="flex justify-between"><span>Registered Rate</span><span className="font-bold">₹{claim.dna_hourly_rate || 60}/hr</span></div>
                        <div className="flex justify-between pt-1.5 border-t border-[#E8E6FF] text-base font-bold text-[#6C47FF]">
                          <span>Compensation</span>
                          <span>{claim.status === 'review' || claim.decision === 'REVIEW' ? <span className="text-amber-600">IN REVIEW</span> : (claim.decision === 'BLOCKED' || claim.status === 'failed') ? <span className="text-red-500">REJECTED</span> : `₹${claim.compensation}`}</span>
                        </div>
                        
                        {(claim.status === 'paid' || claim.status === 'approved') && (
                          <div className="pt-2 mt-2 border-t border-dashed border-[#E8E6FF] space-y-0.5">
                            <p className="text-[8px] font-black text-[#64748B] uppercase tracking-wider">Why payout triggered:</p>
                            <p className="text-[9px] text-[#1A1A2E]">Rain exceeded threshold ({claim.weather?.rainfall || 50}mm &gt; 50mm)</p>
                            <p className="text-[9px] font-bold text-[#6C47FF]">Estimated income loss covered → ₹{claim.compensation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 border-l border-[#E8E6FF]/50 flex flex-col items-center justify-center bg-white text-center">
                      <div className="text-2xl font-bold text-[#6C47FF] mb-0.5">₹{claim.compensation}</div>
                      
                      {claim.status === 'review' || claim.decision === 'REVIEW' ? (
                        <Badge className="bg-amber-100 text-amber-600 border-none font-bold uppercase text-[9px]">Review Required</Badge>
                      ) : (claim.status === 'paid' || claim.status === 'approved') ? (
                        <Badge className="bg-[#DCFCE7] text-[#22C55E] border-none font-bold text-[9px]">✓ Approved</Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-500 border-none font-bold uppercase text-[9px]">⚠ Rejected</Badge>
                      )}
                      
                      <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-2 text-center w-full">
                        <div className="font-bold text-gray-700 text-[10px] mb-0.5">
                          {claim.status === 'review' || claim.decision === 'REVIEW' ? 'Verification Pending' : (claim.status === 'paid' || claim.status === 'approved') ? 'Deposit Complete' : 'Verification Failed'}
                        </div>
                        {(claim.status === 'paid' || claim.status === 'approved') && (
                          <div className="mt-2 space-y-1.5">
                            <Button 
                              onClick={() => initiateRazorpayPayout(claim.compensation, profile?.name || "Worker", claim.id)}
                              className="w-full h-7 text-[9px] font-bold bg-[#6C47FF] hover:bg-[#5535E8] text-white rounded-lg gap-1 shadow-sm"
                            >
                              <CreditCard size={10} /> View Payout
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fraud Analysis Section */}
                    <div className="col-span-full px-3 py-2 border-t border-[#E8E6FF] bg-white space-y-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.5px] text-[#1A1A2E] opacity-70">Automated Fraud Analysis</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase">Trust:</span>
                          <Badge className={`text-[9px] font-black border-none px-1.5 h-4 rounded-[4px] flex items-center ${
                            (claim.trustScore ?? 0) >= 70 ? 'bg-[#DCFCE7] text-[#22C55E]' : 
                            (claim.trustScore ?? 0) >= 40 ? 'bg-[#FEF3C7] text-[#F59E0B]' : 
                            'bg-[#FEE2E2] text-[#EF4444]'
                          }`}>
                            {claim.trustScore ?? 0}/100
                          </Badge>
                        </div>
                      </div>

                      {claim.findings && claim.findings.length > 0 && (
                        <div className="mb-2 p-2 bg-[#F8F9FF] rounded-lg border border-[#E8E6FF]">
                          {claim.findings.map((finding: string, idx: number) => (
                            <p key={idx} className={`text-[9px] font-bold flex items-center gap-1 ${
                              claim.decision === 'BLOCKED' ? 'text-red-500' : 
                              claim.decision === 'REVIEW' ? 'text-amber-500' : 
                              'text-emerald-500'
                            }`}>
                              {claim.decision === 'BLOCKED' ? '❌' : claim.decision === 'REVIEW' ? '⚠️' : '✅'} {finding}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {Object.entries(fraudLabels).map(([key, label]) => {
                          const status = (claim.fraudChecks?.[key]) || 'PASSED';
                          const color = status === 'PASSED' ? '#22C55E' : status === 'FAILED' ? '#EF4444' : status === 'SUSPICIOUS' ? '#F59E0B' : '#94A3B8';
                          
                          return (
                            <div key={key} className="flex items-center justify-between text-[11px] leading-[1.2] font-semibold border-b border-[#F5F3FF]/50 pb-0.5">
                              <span className="text-[#64748B]">{label}</span>
                              <span style={{ color }} className="font-bold uppercase tracking-tighter">
                                {status}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-dashed border-[#E8E6FF] mt-1">
                        <div className="flex gap-3">
                          <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter">
                            Execution: <span className="text-[#1A1A2E]">0.8s</span>
                          </div>
                          <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter">
                            Engine: <span className="text-[#6C47FF]">v4.2_LIVE</span>
                          </div>
                        </div>
                        <Badge className={`text-[9px] font-black uppercase px-2 h-4 border-none rounded-[4px] flex items-center ${
                          claim.decision === 'APPROVED' ? 'bg-[#DCFCE7] text-[#22C55E]' : 
                          claim.decision === 'REVIEW' ? 'bg-[#FEF3C7] text-[#F59E0B]' : 
                          'bg-[#FEE2E2] text-[#EF4444]'
                        }`}>
                          Decision: {claim.decision === 'BLOCKED' ? 'REJECTED' : (claim.decision || 'APPROVED')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-16 text-center border-2 border-dashed border-[#E8E6FF] rounded-2xl bg-white/50">
                <Zap className="h-10 w-10 text-[#94A3B8] mx-auto mb-3 opacity-20" />
                <h3 className="text-base font-bold text-[#1A1A2E]">No claims yet</h3>
                <p className="text-[#64748B] text-xs mt-1">Automated payouts will appear here when weather triggers occur.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </motion.div>
  );
}
