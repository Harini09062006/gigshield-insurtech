"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { doc, collection, query, limit, where, addDoc, serverTimestamp } from "firebase/firestore";
import { Shield, Zap, AlertCircle, Map as MapIcon, Brain, Home, FileText, LogOut, Loader2, IndianRupee, MapPin, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCityRainfall } from "@/services/weatherService";
import { getUserLocation, gpsCheck } from "@/services/locationService";
import { evaluateClaim } from "@/services/claimService";
import { format } from "date-fns";

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [rainfall, setRainfall] = useState<number>(0);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) router.replace("/");
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (!profile?.city) return;
    const fetchWeather = async () => {
      const mm = await getCityRainfall(profile.city);
      setRainfall(mm);
      setIsWeatherLoading(false);
    };
    fetchWeather();
  }, [profile?.city]);

  const riskInfo = useMemo(() => {
    if (rainfall >= 50) return { percent: 95, label: "Severe Rainfall", badgeClass: "bg-red-100 text-red-600" };
    if (rainfall >= 10) return { percent: 45, label: "Moderate Rain", badgeClass: "bg-blue-100 text-blue-600" };
    return { percent: 20, label: "Clear Conditions", badgeClass: "bg-green-100 text-green-600" };
  }, [rainfall]);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "claims"), where("userId", "==", user.uid), limit(10));
  }, [db, user?.uid]);
  
  const { data: claims } = useCollection(claimsQuery);

  const simulateWeather = async () => {
    if (!user?.uid || !profile || !db) return;
    
    setIsSimulating(true);
    try {
      let currentLoc = null;
      try {
        currentLoc = await getUserLocation();
      } catch (e) {}

      const verification = gpsCheck(
        profile.lat && profile.lng ? { lat: profile.lat, lng: profile.lng } : undefined,
        currentLoc || undefined
      );

      // Generate random trust score for simulation
      const randomTrust = Math.floor(Math.random() * 60) + 30; // 30-90
      const processing = evaluateClaim(verification, randomTrust);

      const hour = new Date().getHours();
      const baseRate = profile.avg_hourly_earnings || 60;
      const compensation = Math.round(baseRate * 3.5);

      await addDoc(collection(db, "claims"), {
        userId: user.uid,
        worker_id: user.uid,
        claim_number: `GS-${Math.floor(100000 + Math.random() * 900000)}`,
        trigger_type: "weather",
        compensation,
        status: processing.status,
        decision: processing.decision,
        reason: processing.reason,
        trustScore: randomTrust,
        lat: currentLoc?.lat || 0,
        lng: currentLoc?.lng || 0,
        gps_verification: verification,
        created_at: serverTimestamp()
      });

      toast({ 
        title: processing.status === 'failed' ? "Claim Blocked" : "Claim Submitted", 
        description: processing.reason 
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSimulating(false);
    }
  };

  if (isUserLoading || isProfileLoading || !mounted) {
    return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#EEEEFF] flex flex-col font-body">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn"><Shield className="h-6 w-6 text-white" /></div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">GigShield</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[#6C47FF] bg-[#EDE9FF]"><Home className="h-6 w-6" /></Button>
          <Link href="/claims"><Button variant="ghost" size="icon" className="text-[#64748B]"><FileText className="h-6 w-6" /></Button></Link>
          <Button onClick={() => auth.signOut()} variant="ghost" size="icon" className="text-[#EF4444]"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-6 lg:px-10 max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome, {profile?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-[#64748B] font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" /> GPS Fraud Detection Active
            </p>
          </div>
          <Button onClick={simulateWeather} disabled={isSimulating} className="bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl h-11 px-6">
            {isSimulating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <MapPin className="mr-2 h-4 w-4" />}
            Simulate Disruption (GPS Test)
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-[#6C47FF] text-white border-none shadow-btn rounded-[20px] p-6">
            <p className="text-[10px] font-bold uppercase opacity-80">Security Status</p>
            <h3 className="text-2xl font-bold mb-4">GPS PROTECTED</h3>
            <div className="bg-white/10 p-3 rounded-xl">
              <p className="text-[9px] uppercase opacity-60">Base Coordinates</p>
              <p className="text-xs font-bold">{profile?.lat ? `${profile.lat.toFixed(3)}, ${profile.lng.toFixed(3)}` : "Not set"}</p>
            </div>
          </Card>
          
          <Card className="bg-white border-[#E8E6FF] shadow-card rounded-[20px] p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">AI Risk Prediction</p>
              <Brain className="h-5 w-5 text-[#6C47FF]" />
            </div>
            <div className="flex justify-between items-end mb-4">
              <div className="text-3xl font-bold text-[#1A1A2E]">{rainfall.toFixed(1)}mm</div>
              <Badge className={`${riskInfo.badgeClass} border-none font-bold`}>{riskInfo.label}</Badge>
            </div>
            <Progress value={riskInfo.percent} className="h-1.5 bg-[#EEEEFF]" />
          </Card>

          <Card className="bg-[#FFFBEA] border-[#FEF3C7] shadow-card rounded-[20px] p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">Fraud Protection</p>
              <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
            </div>
            <div className="text-xl font-bold text-[#1A1A2E]">Radius Locked</div>
            <p className="text-[10px] text-[#64748B] mt-2 italic">Your 1km delivery zone is verified during triggers.</p>
          </Card>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#1A1A2E]">My Claim History</h2>
          <div className="bg-white rounded-2xl border border-[#E8E6FF] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FF] border-b border-[#E8E6FF]">
                <tr className="text-[10px] font-black text-[#94A3B8] uppercase">
                  <th className="p-4">Claim ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Fraud Decision</th>
                  <th className="p-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6FF]">
                {claims?.map(c => (
                  <tr key={c.id}>
                    <td className="p-4 font-mono text-[10px]">#{c.claim_number}</td>
                    <td className="p-4 font-bold">₹{c.compensation}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`capitalize font-bold ${
                        c.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                        c.status === 'review' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {c.status === 'approved' ? '✅ Paid' : c.status === 'review' ? '⚠️ In Review' : '❌ Failed'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase ${
                          c.decision === 'APPROVED' ? 'text-green-600' : 
                          c.decision === 'REVIEW' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {c.decision}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-[10px] text-[#64748B] max-w-[200px] truncate">{c.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
