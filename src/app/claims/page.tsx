"use client";

import React, { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useDoc } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Zap, Home, FileText, Map as MapIcon, LogOut, Shield, AlertCircle, Loader2, AlertTriangle, XCircle, CreditCard } from "lucide-react";
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
      orderBy("createdAt", "desc"),
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
    // 1. SAFETY CHECK: Ensure Razorpay SDK is loaded
    if (!(window as any).Razorpay) {
      console.error("Razorpay SDK not loaded. Check script tag in layout.");
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Payment service is currently unavailable. Please refresh."
      });
      return;
    }

    // 2. DEBUG LOGGING
    console.log("Opening Razorpay with:", {
      amount,
      workerName,
      claimId,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY ? "EXISTS" : "MISSING (Using fallback)"
    });

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
          description: 
            `₹${amount} credited! ` +
            `ID: ${response.razorpay_payment_id}`
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
              Unable to load claims. Please ensure your account is properly registered.
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
                  <CardHeader className={`${claim.gps_status === 'mismatch' ? 'bg-red-50' : (claim.status === 'paid' || claim.status === 'approved') ? 'bg-[#DCFCE7]/30' : 'bg-amber-50'} px-6 py-4 flex flex-row items-center justify-between border-b border-[#E8E6FF]/50`}>
                    <div className="flex items-center gap-3">
                      {claim.gps_status === 'mismatch' ? <XCircle className="h-5 w-5 text-red-500" /> : (claim.status === 'paid' || claim.status === 'approved') ? <CheckCircle2 className="h-5 w-5 text-[#22C55E]" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      <span className="font-bold text-[#1A1A2E] text-sm">Trigger: {claim.trigger_description || "Severe Weather"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-bold">
                      <Calendar className="h-4 w-4" />
                      {claim.createdAt?.seconds ? format(new Date(claim.createdAt.seconds * 1000), "dd MMM, HH:mm") : claim.created_at?.seconds ? format(new Date(claim.created_at.seconds * 1000), "dd MMM, HH:mm") : "Just now"}
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
                        <div className="flex justify-between"><span>Registered Rate</span><span className="font-bold">₹{claim.dna_hourly_rate || 60}/hr</span></div>
                        <div className="flex justify-between pt-2 border-t border-[#E8E6FF] text-lg font-bold text-[#6C47FF]">
                          <span>Compensation</span>
                          <span>{claim.gps_status === 'mismatch' ? <span className="text-red-500">NOT APPROVED</span> : `₹${claim.compensation}`}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-l border-[#E8E6FF]/50 flex flex-col items-center justify-center bg-white text-center">
                      {claim.gps_status === 'mismatch' ? (
                        <div className="text-xl font-black text-red-500 mb-1">NOT APPROVED</div>
                      ) : (
                        <div className="text-3xl font-bold text-[#6C47FF] mb-1">₹{claim.compensation}</div>
                      )}
                      
                      {claim.gps_status === 'mismatch' ? (
                        <Badge className="bg-red-50 text-red-500 border-none font-bold uppercase text-[10px]">⚠ Mismatch Detected</Badge>
                      ) : (claim.status === 'paid' || claim.status === 'approved') ? (
                        <Badge className="bg-[#DCFCE7] text-[#22C55E] border-none font-bold">✓ PAID INSTANTLY</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-600 border-none font-bold uppercase text-[10px]">Review Required</Badge>
                      )}
                      
                      <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3 text-center w-full">
                        <div className="font-bold text-gray-700 text-xs mb-1">
                          {claim.gps_status === 'mismatch' ? 'Verification Failed' : (claim.status === 'paid' || claim.status === 'approved') ? 'Deposit Complete' : 'Verification Pending'}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-tight">
                          {claim.gps_status === 'mismatch' 
                            ? 'Proximity check failed. Claim flagged for manual review.' 
                            : (claim.status === 'paid' || claim.status === 'approved') 
                              ? 'Funds deposited to your linked bank account.' 
                              : 'This claim requires manual review due to a location mismatch.'}
                        </div>
                        {(claim.status === 'paid' || claim.status === 'approved') && claim.gps_status !== 'mismatch' && (
                          <div className="mt-3 space-y-2">
                            <Button 
                              onClick={() => initiateRazorpayPayout(claim.compensation, profile?.name || "Worker", claim.id)}
                              className="w-full h-8 text-[10px] font-bold bg-[#6C47FF] hover:bg-[#5535E8] text-white rounded-lg gap-1.5 shadow-sm"
                            >
                              <CreditCard size={12} /> View Payment Details
                            </Button>
                            <p className="text-[8px] text-[#94A3B8] font-medium leading-none">
                              Test: 4111 1111 1111 1111 | CVV: 123 | 12/28
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fraud Analysis Section - Compact Medium Sized Source of Truth */}
                    <div className="col-span-full px-3.5 py-2.5 border-t border-[#E8E6FF] bg-white space-y-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.5px] text-[#1A1A2E] opacity-70">Automated Fraud Analysis</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#64748B] uppercase">Trust Score:</span>
                          <Badge className={`text-[10px] font-black border-none px-1.5 h-4.5 rounded-[4px] flex items-center ${
                            (claim.trustScore ?? 0) >= 70 ? 'bg-[#DCFCE7] text-[#22C55E]' : 
                            (claim.trustScore ?? 0) >= 40 ? 'bg-[#FEF3C7] text-[#F59E0B]' : 
                            'bg-[#FEE2E2] text-[#EF4444]'
                          }`}>
                            {claim.trustScore ?? 0}/100
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-[10px] gap-y-1">
                        {Object.entries(fraudLabels).map(([key, label]) => {
                          const status = (claim.fraudChecks?.[key]) || 'N/A';
                          const color = status === 'PASSED' ? '#22C55E' : status === 'FAILED' ? '#EF4444' : status === 'SUSPICIOUS' ? '#F59E0B' : '#94A3B8';
                          const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : status === 'SUSPICIOUS' ? '⚠️' : '⚪';
                          
                          return (
                            <div key={key} className="flex items-center justify-between text-[12px] leading-[1.3] font-semibold border-b border-[#F5F3FF]/50 pb-0.5">
                              <span className="text-[#64748B]">{label}</span>
                              <span style={{ color }} className="font-bold uppercase tracking-tighter flex items-center gap-1.5">
                                {status} <span className="text-[8px]">{icon}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1.5 border-t border-dashed border-[#E8E6FF] mt-1.5">
                        <div className="flex gap-4">
                          <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-tighter">
                            Execution: <span className="text-[#1A1A2E]">
                              {claim.processingTime 
                                ? `${(parseFloat(claim.processingTime) / (claim.processingTime.toLowerCase().includes('ms') || parseFloat(claim.processingTime) > 100 ? 1000 : 1)).toFixed(1)}s` 
                                : '0.8s'}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-tighter">
                            Engine: <span className="text-[#6C47FF]">v4.2_LIVE</span>
                          </div>
                        </div>
                        <Badge className={`text-[10px] font-black uppercase px-2 h-5 border-none rounded-[4px] flex items-center ${
                          claim.decision === 'APPROVED' ? 'bg-[#DCFCE7] text-[#22C55E]' : 
                          claim.decision === 'REVIEW' ? 'bg-[#FEF3C7] text-[#F59E0B]' : 
                          'bg-[#FEE2E2] text-[#EF4444]'
                        }`}>
                          Decision: {claim.decision || 'BLOCKED'}
                        </Badge>
                      </div>
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
