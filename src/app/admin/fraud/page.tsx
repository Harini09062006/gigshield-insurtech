"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Zap,
  MapPin,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Fingerprint
} from "lucide-react";
import { 
  useFirestore, 
  useUser, 
  useAuth 
} from "@/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const FRAUD_LABELS: Record<string, string> = {
  gpsValidation: "GPS Validation",
  orderHistory: "Order History",
  deviceCheck: "Device Fingerprint",
  duplicateCheck: "No Duplicate",
  accountAge: "Account Age",
  weatherIntelligence: "Weather Intel",
  behaviorPattern: "Behavior Pattern",
  networkAnalysis: "Network Analysis"
};

export default function AdminFraudPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. ROLE-BASED ACCESS CONTROL
  useEffect(() => {
    async function checkAdmin() {
      if (isUserLoading) return;
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace("/dashboard");
        }
      } catch (e) {
        router.replace("/dashboard");
      }
    }
    checkAdmin();
  }, [user, isUserLoading, db, router]);

  // 2. REAL-TIME DATA SYNC
  useEffect(() => {
    if (!isAdmin || !db) return;

    const q = query(
      collection(db, "claims"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const claimsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClaims(claimsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, db]);

  // 3. STATS CALCULATION
  const stats = useMemo(() => {
    return {
      approved: claims.filter(c => c.decision === "APPROVED").length,
      blocked: claims.filter(c => c.decision === "BLOCKED").length,
      review: claims.filter(c => c.decision === "REVIEW").length,
      saved: claims.filter(c => c.decision === "BLOCKED").reduce((sum, c) => sum + (c.compensation || 0), 0)
    };
  }, [claims]);

  // 4. FILTERING LOGIC
  const filteredClaims = useMemo(() => {
    let result = claims;
    if (filter !== "all") {
      result = result.filter(c => c.decision === filter.toUpperCase());
    }
    if (searchQuery) {
      result = result.filter(c => 
        c.worker_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.trigger_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [claims, filter, searchQuery]);

  // 5. ADMIN ACTIONS
  const updateDecision = async (claimId: string, decision: "APPROVED" | "BLOCKED") => {
    try {
      await updateDoc(doc(db, "claims", claimId), {
        decision,
        status: decision === "APPROVED" ? "approved" : "failed",
        admin_override: true,
        updatedAt: serverTimestamp()
      });
      toast({
        title: `Claim ${decision === "APPROVED" ? "Approved" : "Blocked"}`,
        description: `Manual override complete.`
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: e.message
      });
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
        <p className="text-sm font-bold text-[#1A1A2E] animate-pulse uppercase tracking-widest">Loading Fraud Intelligence...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#EEEEFF] font-body text-[#1A1A2E]">
      
      {/* HEADER */}
      <header className="bg-white border-b border-[#E8E6FF] px-8 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-[#6C47FF]" />
                <h1 className="text-2xl font-black tracking-tight">Fraud Management</h1>
              </div>
              <p className="text-xs text-[#64748B] font-bold uppercase tracking-widest mt-1">Real-Time Verification Auditing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input 
                type="text"
                placeholder="Search Worker ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#F8F9FF] border border-[#E8E6FF] rounded-xl text-sm focus:outline-none focus:border-[#6C47FF] w-64"
              />
            </div>
            <Button className="bg-[#6C47FF] hover:bg-[#5535E8] rounded-xl font-bold gap-2">
              <Zap size={16} /> Run Engine
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-card rounded-[24px] bg-white overflow-hidden">
            <div className="h-1 bg-[#22C55E]" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Genuine Claims</p>
                  <h3 className="text-3xl font-black text-[#22C55E] mt-1">{stats.approved}</h3>
                </div>
                <div className="h-12 w-12 bg-[#DCFCE7] rounded-2xl flex items-center justify-center text-[#22C55E]">
                  <ShieldCheck size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card rounded-[24px] bg-white overflow-hidden">
            <div className="h-1 bg-[#EF4444]" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Fraud Blocked</p>
                  <h3 className="text-3xl font-black text-[#EF4444] mt-1">{stats.blocked}</h3>
                </div>
                <div className="h-12 w-12 bg-[#FEE2E2] rounded-2xl flex items-center justify-center text-[#EF4444]">
                  <ShieldAlert size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card rounded-[24px] bg-white overflow-hidden">
            <div className="h-1 bg-[#F59E0B]" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Under Review</p>
                  <h3 className="text-3xl font-black text-[#F59E0B] mt-1">{stats.review}</h3>
                </div>
                <div className="h-12 w-12 bg-[#FEF3C7] rounded-2xl flex items-center justify-center text-[#F59E0B]">
                  <Clock size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-card rounded-[24px] bg-[#6C47FF] text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-70 tracking-wider">Total Saved ₹</p>
                  <h3 className="text-3xl font-black mt-1">₹{stats.saved}</h3>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTERS */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-[#E8E6FF]">
          <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="bg-transparent gap-2 h-10">
              <TabsTrigger value="all" className="rounded-xl px-6 data-[state=active]:bg-[#6C47FF] data-[state=active]:text-white font-bold">All Logs</TabsTrigger>
              <TabsTrigger value="approved" className="rounded-xl px-6 data-[state=active]:bg-[#22C55E] data-[state=active]:text-white font-bold">Approved</TabsTrigger>
              <TabsTrigger value="review" className="rounded-xl px-6 data-[state=active]:bg-[#F59E0B] data-[state=active]:text-white font-bold">Manual Review</TabsTrigger>
              <TabsTrigger value="blocked" className="rounded-xl px-6 data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Blocked</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* CLAIMS LIST */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-none shadow-card rounded-[24px] bg-white overflow-hidden group hover:ring-2 hover:ring-[#6C47FF]/20 transition-all">
                    <div className="grid md:grid-cols-[1fr,350px]">
                      
                      {/* MAIN INFO */}
                      <div className="p-8 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                              claim.decision === 'APPROVED' ? 'bg-[#DCFCE7] text-[#22C55E]' :
                              claim.decision === 'REVIEW' ? 'bg-[#FEF3C7] text-[#F59E0B]' :
                              'bg-[#FEE2E2] text-[#EF4444]'
                            }`}>
                              {claim.decision === 'APPROVED' ? <CheckCircle2 /> : <ShieldAlert />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-black text-[#1A1A2E]">Worker: {claim.worker_id?.slice(0, 8)}...</h4>
                                <Badge className="bg-[#F1F0FF] text-[#6C47FF] border-none text-[10px] font-bold uppercase tracking-widest px-3">
                                  {claim.trigger_description || "System Simulation"}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#64748B] font-medium flex items-center gap-2 mt-1">
                                <MapPin size={12} /> Live Scan Origin · {claim.lat?.toFixed(4)}, {claim.lng?.toFixed(4)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-black text-[#1A1A2E]">₹{claim.compensation}</p>
                            <p className="text-[10px] font-black uppercase text-[#64748B] mt-1 tracking-widest">
                              Triggered {claim.createdAt?.seconds ? format(new Date(claim.createdAt.seconds * 1000), "HH:mm · MMM dd") : "Just now"}
                            </p>
                          </div>
                        </div>

                        {/* FRAUD ALERTS */}
                        {claim.decision === 'BLOCKED' && (
                          <div className="bg-[#FEE2E2] border border-[#FECACA] p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 bg-white/50 rounded-full flex items-center justify-center text-[#EF4444] animate-pulse">
                              <ShieldAlert size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#EF4444] uppercase tracking-widest">🚨 Fraud Signature Detected</p>
                              <p className="text-xs text-[#EF4444] font-bold mt-0.5 opacity-80">Claim violated critical integrity rules. Automated block applied.</p>
                            </div>
                          </div>
                        )}

                        {claim.decision === 'REVIEW' && (
                          <div className="bg-[#FEF3C7] border border-[#FDE68A] p-4 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 bg-white/50 rounded-full flex items-center justify-center text-[#F59E0B]">
                              <AlertTriangle size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#F59E0B] uppercase tracking-widest">⚠️ Verification Anomaly</p>
                              <p className="text-xs text-[#F59E0B] font-bold mt-0.5 opacity-80">Decision uncertainty exceeds automated thresholds. Manual review required.</p>
                            </div>
                          </div>
                        )}

                        {/* GRID OF 8 FRAUD CHECKS */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                          {Object.entries(FRAUD_LABELS).map(([key, label]) => {
                            const status = claim.fraudChecks?.[key] || "N/A";
                            return (
                              <div key={key} className="bg-[#F8F9FF] border border-[#E8E6FF] p-3 rounded-xl">
                                <p className="text-[9px] font-black uppercase text-[#94A3B8] tracking-widest mb-1">{label}</p>
                                <div className="flex items-center gap-2">
                                  <div className={`h-1.5 w-1.5 rounded-full ${
                                    status === 'PASSED' ? 'bg-[#22C55E]' :
                                    status === 'FAILED' ? 'bg-[#EF4444]' :
                                    status === 'SUSPICIOUS' ? 'bg-[#F59E0B]' : 'bg-[#D1D5DB]'
                                  }`} />
                                  <span className={`text-[10px] font-black ${
                                    status === 'PASSED' ? 'text-[#22C55E]' :
                                    status === 'FAILED' ? 'text-[#EF4444]' :
                                    status === 'SUSPICIOUS' ? 'text-[#F59E0B]' : 'text-[#64748B]'
                                  }`}>{status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* SIDE PANEL / ACTIONS */}
                      <div className="bg-[#F8F9FF] border-l border-[#E8E6FF] p-8 flex flex-col justify-between">
                        <div className="space-y-6">
                          <div className="text-center p-6 bg-white rounded-[24px] shadow-sm border border-[#E8E6FF] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2">
                              <Fingerprint size={14} className="text-[#6C47FF] opacity-20" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-1">Engine Trust Score</p>
                            <h2 className="text-5xl font-black text-[#6C47FF]">{claim.trustScore ?? 0}</h2>
                            <p className="text-[10px] font-bold text-[#64748B] mt-2">Scale: 0 - 100 Risk Basis</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-[#64748B]">Proc. Time</span>
                              <span className="text-[#1A1A2E]">{claim.processingTime || "0.8s"}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-[#64748B]">Engine Ver.</span>
                              <span className="text-[#1A1A2E]">v4.2_LIVE</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-[#64748B]">Decision</span>
                              <Badge className={`uppercase text-[9px] font-black ${
                                claim.decision === 'APPROVED' ? 'bg-[#DCFCE7] text-[#22C55E]' :
                                claim.decision === 'REVIEW' ? 'bg-[#FEF3C7] text-[#F59E0B]' :
                                'bg-[#FEE2E2] text-[#EF4444]'
                              }`}>
                                {claim.decision || "BLOCKED"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-8">
                          <Button 
                            onClick={() => updateDecision(claim.id, "APPROVED")}
                            disabled={claim.decision === 'APPROVED'}
                            className="bg-white border-2 border-[#22C55E] text-[#22C55E] hover:bg-[#DCFCE7] rounded-xl font-black text-xs h-12 gap-2 shadow-sm"
                          >
                            <CheckCircle2 size={16} /> APPROVE
                          </Button>
                          <Button 
                            onClick={() => updateDecision(claim.id, "BLOCKED")}
                            disabled={claim.decision === 'BLOCKED'}
                            variant="outline"
                            className="bg-white border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl font-black text-xs h-12 gap-2 shadow-sm"
                          >
                            <XCircle size={16} /> BLOCK
                          </Button>
                        </div>
                      </div>

                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-[#E8E6FF] p-20 rounded-[32px] text-center space-y-4 opacity-60">
                <Shield className="h-16 w-16 text-[#D4CCFF] mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#1A1A2E]">No logs detected</h3>
                  <p className="text-[#64748B] font-medium">Claims matching your filter will appear here in real-time.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto p-10 text-center">
        <p className="text-[10px] font-black uppercase text-[#94A3B8] tracking-[0.3em]">
          GigShield Security Intelligence Console • Restricted Access
        </p>
      </footer>
    </div>
  );
}
