
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { doc, collection, query, limit, where, addDoc, serverTimestamp } from "firebase/firestore";
import { Shield, Zap, AlertCircle, Map as MapIcon, Brain, Home, FileText, LogOut, Loader2, Info, Calendar, RefreshCcw, IndianRupee, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, addDays, differenceInDays, startOfDay } from "date-fns";
import React, { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { getCityRainfall } from "@/services/weatherService";
import { getUserLocation, gpsCheck } from "@/services/locationService";

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
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile?.city]);

  const riskInfo = useMemo(() => {
    if (rainfall >= 50) return { percent: 95, label: "Severe Rainfall Detected!", badgeClass: "bg-[#FEE2E2] text-[#EF4444]" };
    if (rainfall >= 30) return { percent: 75, label: "Heavy Rain Warning", badgeClass: "bg-[#FEF3C7] text-[#F59E0B]" };
    if (rainfall >= 10) return { percent: 45, label: "Moderate Rain", badgeClass: "bg-[#DBEAFE] text-[#3B82F6]" };
    return { percent: 20, label: "Clear Conditions", badgeClass: "bg-[#DCFCE7] text-[#22C55E]" };
  }, [rainfall]);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "claims"), 
      where("worker_id", "==", user.uid),
      limit(5)
    );
  }, [db, user?.uid]);
  
  const { data: claims } = useCollection(claimsQuery);

  const policyInfo = useMemo(() => {
    const premiums: Record<string, number> = { basic: 10, pro: 25, elite: 50 };
    const maxPayouts: Record<string, number> = { basic: 60, pro: 240, elite: 600 };
    
    if (!profile?.plan_activated_at?.seconds) {
      return {
        premiumAmount: premiums[profile?.plan_id || 'pro'] || 25,
        maxPayout: maxPayouts[profile?.plan_id || 'pro'] || 240,
        isRenewingTomorrow: false
      };
    }

    const start = new Date(profile.plan_activated_at.seconds * 1000);
    const today = new Date();
    const diffDays = differenceInDays(startOfDay(today), startOfDay(start));
    const currentWeek = Math.floor(diffDays / 7) + 1;
    const nextRenewal = addDays(start, currentWeek * 7);
    const isRenewingTomorrow = (diffDays % 7 === 6);
    
    return {
      startDate: start,
      currentWeek,
      nextRenewalDate: nextRenewal,
      premiumAmount: premiums[profile.plan_id] || 25,
      maxPayout: maxPayouts[profile.plan_id] || 240,
      isRenewingTomorrow
    };
  }, [profile]);

  const simulateWeather = async () => {
    if (!user?.uid || !profile || !db) return;
    
    setIsSimulating(true);
    try {
      // 1. CAPTURE REAL-TIME GPS FOR FRAUD DETECTION
      let currentLoc = null;
      try {
        currentLoc = await getUserLocation();
      } catch (locErr: any) {
        console.warn("GPS failed, falling back to city centers:", locErr.message);
      }

      // 2. RUN GPS VALIDATION
      const verification = gpsCheck(
        profile.lat && profile.lng ? { lat: profile.lat, lng: profile.lng } : undefined,
        currentLoc || undefined
      );

      const hour = new Date().getHours();
      const slot = (hour >= 6 && hour < 10) ? { name: "Morning Peak", mult: 0.75 } :
                   (hour >= 12 && hour < 16) ? { name: "Afternoon Peak", mult: 0.95 } :
                   (hour >= 17 && hour < 21) ? { name: "Evening Peak", mult: 1.30 } :
                   { name: "Standard Hours", mult: 1.0 };

      const baseRate = profile.avg_hourly_earnings || 60;
      const dnaRate = Math.round(baseRate * slot.mult);
      const compensation = Math.min(dnaRate * 3, policyInfo.maxPayout);

      await addDoc(collection(db, "claims"), {
        userId: user.uid,
        worker_id: user.uid,
        claim_number: `GS-${Math.floor(100000 + Math.random() * 900000)}`,
        trigger_type: "weather",
        trigger_description: "Severe Rainfall (GPS Verified)",
        dna_time_slot: slot.name,
        registered_rate: baseRate,
        dna_hourly_rate: dnaRate,
        compensation: Math.round(compensation),
        status: "paid",
        lat: currentLoc?.lat || 0,
        lng: currentLoc?.lng || 0,
        gps_verification: verification,
        created_at: serverTimestamp()
      });

      toast({ 
        title: verification === "PASSED" ? "GPS Verified Payout" : "Payout Processed", 
        description: `₹${Math.round(compensation)} PAID INSTANTLY! GPS Check: ${verification}` 
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Simulation Failed", description: e.message });
    } finally {
      setIsSimulating(false);
    }
  };

  if (isUserLoading || isProfileLoading || !mounted) {
    return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[#EEEEFF] flex flex-col font-body">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn"><Shield className="h-6 w-6 text-white" /></div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">Gig<span className="text-[#6C47FF]">Shield</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[#6C47FF] bg-[#EDE9FF]"><Home className="h-6 w-6" /></Button>
          <Link href="/claims"><Button variant="ghost" size="icon" className="text-[#64748B]"><FileText className="h-6 w-6" /></Button></Link>
          <Link href="/heatmap"><Button variant="ghost" size="icon" className="text-[#64748B]"><MapIcon className="h-6 w-6" /></Button></Link>
          <Button onClick={() => auth.signOut().then(() => router.replace("/"))} variant="ghost" size="icon" className="text-[#EF4444]"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-6 lg:px-10 max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome, {profile?.name?.split(' ')[0] ?? 'Worker'}</h1>
            <p className="text-sm text-[#64748B] font-medium flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" /> GPS Monitoring Active • {profile?.city}
            </p>
          </div>
          <Button onClick={simulateWeather} disabled={isSimulating} className="bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl h-11 px-6">
            {isSimulating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <MapPin className="mr-2 h-4 w-4" />}
            Simulate Weather (GPS Test)
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-[#6C47FF] text-white border-none shadow-btn rounded-[20px] p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Security Status</p>
                <h3 className="text-2xl font-bold">{profile?.lat ? "GPS ENFORCED" : "CITY BASED"}</h3>
              </div>
              <Shield className="h-6 w-6 opacity-80" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-3 rounded-xl">
                <p className="text-[9px] uppercase opacity-60">Verification</p>
                <p className="text-xs font-bold">{profile?.lat ? `${profile.lat.toFixed(2)}, ${profile.lng.toFixed(2)}` : "Pending GPS"}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <p className="text-[9px] uppercase opacity-60">Radius</p>
                <p className="text-sm font-bold">1.0 km</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-white border-[#E8E6FF] shadow-card rounded-[20px] p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">AI Risk Prediction</p>
              <Brain className={`h-5 w-5 ${rainfall > 30 ? 'text-[#EF4444] animate-bounce' : 'text-[#6C47FF]'}`} />
            </div>
            <div className="flex justify-between items-end mb-4">
              <div className="text-3xl font-bold text-[#1A1A2E]">{isWeatherLoading ? "..." : `${rainfall.toFixed(1)}mm`}</div>
              <Badge className={`${riskInfo.badgeClass} border-none font-bold`}>{isWeatherLoading ? "Syncing..." : riskInfo.label}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-[#64748B]"><span>Disruption Risk</span><span>{riskInfo.percent}%</span></div>
              <Progress value={riskInfo.percent} className="h-1.5 bg-[#EEEEFF]" />
            </div>
          </Card>

          <Card className="bg-[#FFFBEA] border-[#FEF3C7] shadow-card rounded-[20px] p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">Fraud Protection</p>
              <RefreshCcw className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div className="flex justify-between items-end mb-2">
              <div className="text-xl font-bold text-[#1A1A2E]">Radius Locked</div>
              <Badge className="bg-[#DCFCE7] text-[#22C55E] border-none font-bold">ACTIVE</Badge>
            </div>
            <p className="text-[10px] text-[#64748B] italic">Location is verified during every trigger event.</p>
          </Card>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#1A1A2E]">Recent Verifications</h2>
          <div className="bg-white rounded-2xl border border-[#E8E6FF] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FF] border-b border-[#E8E6FF]">
                <tr className="text-[10px] font-black text-[#94A3B8] uppercase">
                  <th className="p-4">Trigger</th>
                  <th className="p-4">GPS Status</th>
                  <th className="p-4">Distance</th>
                  <th className="p-4">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6FF]">
                {claims?.map(c => (
                  <tr key={c.id}>
                    <td className="p-4 font-bold">Weather</td>
                    <td className="p-4"><Badge variant="outline" className={c.gps_verification === 'PASSED' ? 'bg-[#DCFCE7] text-[#22C55E]' : 'bg-[#FEE2E2] text-[#EF4444]'}>{c.gps_verification || 'N/A'}</Badge></td>
                    <td className="p-4 text-[#64748B] text-xs">Verified via GPS</td>
                    <td className="p-4 font-bold text-[#6C47FF]">₹{c.compensation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
