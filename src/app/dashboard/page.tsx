"use client";

import React, { useEffect, useState } from "react";
import { 
  Shield, 
  Loader2, 
  Zap, 
  Sunrise, 
  Sunset, 
  Sun, 
  Moon, 
  Brain, 
  Home,
  FileText,
  Map as MapIcon,
  LogOut,
  IndianRupee,
  RefreshCcw,
  Calendar,
  Info,
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ClaimNotification } from "@/components/ClaimNotification";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Helper function for Live Risk Score
const calculateRiskScore = (
  rainfall: number,
  city: string,
  hour: number
): number => {
  let score = 0
  
  // Weather points (max 40)
  if (rainfall > 50) score += 40
  else if (rainfall > 30) score += 30
  else if (rainfall > 10) score += 20
  else score += 5
  
  // City risk (max 30)
  const HIGH = [
    'Chennai','Mumbai','Kolkata',
    'Kochi','Howrah'
  ]
  score += HIGH.includes(city) ? 30 : 15
  
  // Time risk (max 30)
  if (hour >= 17 && hour <= 21) score += 30
  else if (hour >= 12 && hour <= 16) score += 20
  else score += 10
  
  return Math.min(score, 100)
}

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [simulating, setSimulating] = useState(false);
  const [simulateCount, setSimulateCount] = useState(0);
  const [fraudChecks, setFraudChecks] = useState<any>(null);
  const [notif, setNotif] = useState<any>(null);
  
  const [weatherData, setWeatherData] = useState({
    rainfall: 12,
    description: "Light Rain",
    temperature: 28
  });
  const [disruptionRisk, setDisruptionRisk] = useState(35);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() =>
    user ? doc(db, "users", user.uid) : null,
    [db, user?.uid]
  );
  const { data: profile } = useDoc(profileRef);

  const riskScore = calculateRiskScore(
    weatherData?.rainfall || 0,
    profile?.city || "",
    new Date().getHours()
  );

  const metrics = React.useMemo(() => {
    if (!profile) return { incomeLoss: 0, coverage: 0, remainingRisk: 0, premium: 0, riskScore: 35 };

    const riskScoreValue = profile.riskScore ?? 35;
    const plan = profile.plan_id ?? "pro";
    const baseRate = profile.avg_hourly_earnings ?? 60;
    
    const incomeLoss = Math.round((baseRate * 1.3) * 3 * (riskScoreValue / 100));
    const coverage = plan === "basic" ? 60 : plan === "pro" ? 240 : 600;
    const premium = plan === "basic" ? 10 : plan === "pro" ? 25 : 50;
    const remainingRisk = Math.max(0, incomeLoss - coverage);

    return { incomeLoss, coverage, remainingRisk, premium, riskScore: riskScoreValue };
  }, [profile]);

  const handleSimulateWeather = async () => {
    if (!user?.uid || !db) return;
    
    setSimulating(true);
    const currentCount = simulateCount;
    setSimulateCount(prev => prev + 1);

    try {
      const isFirst = currentCount === 0;
      
      const API_KEY = "be5f61ff6b261dedfa89e321d466a063";
      const realWeatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${profile?.city || "Chennai"},IN&units=metric&appid=${API_KEY}`
      );
      const realWeatherData = await realWeatherRes.json();
      
      const severeRainfall = 65;
      const newRisk = isFirst ? 75 : 95;

      const hour = new Date().getHours();
      const timeSlot = 
        hour >= 6 && hour < 10 ? "Morning Peak" :
        hour >= 12 && hour < 16 ? "Afternoon Peak" :
        hour >= 17 && hour < 21 ? "Evening Peak" :
        "Night Shift";
      
      const multipliers: Record<string, number> = {
        "Morning Peak": 0.75,
        "Afternoon Peak": 0.95,
        "Evening Peak": 1.30,
        "Night Shift": 0.85
      };
      
      const baseRate = profile?.avg_hourly_earnings || 60;
      const multiplier = multipliers[timeSlot];
      const hoursLost = 3;
      const rawAmount = baseRate * multiplier * hoursLost;
      const maxPayout = profile?.plan_id === 'basic' ? 60 : profile?.plan_id === 'elite' ? 600 : 240;
      const compensation = Math.min(rawAmount, maxPayout);
      
      const status = isFirst ? "paid" : "review";
      const decision = isFirst ? "APPROVED" : "REVIEW";
      
      const fraudResult = {
        gps: "PASSED",
        duplicate: isFirst ? "PASSED" : "FAILED",
        status: decision
      };
      
      setFraudChecks(fraudResult);

      await addDoc(collection(db, "claims"), {
        worker_id: user.uid,
        trigger_type: "SEVERE_RAIN",
        trigger_description: isFirst 
          ? `Severe Rainfall (${severeRainfall}mm) Simulated` 
          : `Duplicate Simulation Trigger (${severeRainfall}mm)`,
        timeSlot: timeSlot,
        dna_hourly_rate: Math.round(baseRate * multiplier),
        compensation: Math.round(compensation),
        status: status,
        decision: decision,
        fraudChecks: {
          gpsValidation: "PASSED",
          weatherIntelligence: "PASSED",
          behaviorPattern: "PASSED",
          accountAge: "PASSED",
          orderHistory: "PASSED",
          networkAnalysis: "PASSED",
          duplicateCheck: isFirst ? "PASSED" : "FAILED"
        },
        trustScore: isFirst ? 95 : 45,
        weather: {
          rainfall: severeRainfall,
          temperature: realWeatherData.main?.temp || 28,
          condition: "Storm"
        },
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "users", user.uid), {
        riskScore: newRisk,
        updatedAt: serverTimestamp()
      });

      setWeatherData({
        rainfall: severeRainfall,
        description: isFirst ? "Severe Rainfall" : "Duplicate Detected",
        temperature: realWeatherData.main?.temp || 28
      });
      setDisruptionRisk(newRisk);

      toast({
        title: isFirst ? "⚡ Simulation Success!" : "⚠️ Verification Required",
        description: isFirst 
          ? `Severe weather detected. ₹${Math.round(compensation)} PAID INSTANTLY!` 
          : "Potential duplicate claim detected. Under manual review."
      });

    } catch (error) {
      console.error("Simulation error:", error);
      toast({ variant: "destructive", title: "Error", description: "Simulation failed." });
    } finally {
      setSimulating(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const baseRate = profile?.avg_hourly_earnings || 60;
  const morningRate = Math.round(baseRate * 0.75);
  const afternoonRate = Math.round(baseRate * 0.95);
  const eveningRate = Math.round(baseRate * 1.30);
  const nightRate = Math.round(baseRate * 0.85);

  const currentHour = new Date().getHours();
  let activeSlotName = "Night Shift";
  let activeRate = nightRate;
  if (currentHour >= 6 && currentHour < 10) { activeSlotName = "Morning Peak"; activeRate = morningRate; }
  else if (currentHour >= 12 && currentHour < 16) { activeSlotName = "Afternoon Peak"; activeRate = afternoonRate; }
  else if (currentHour >= 17 && currentHour < 21) { activeSlotName = "Evening Peak"; activeRate = eveningRate; }

  const chartData = [
    { time: "6 AM", evening: 20, lunch: 30, active: 60 },
    { time: "8 AM", evening: 30, lunch: 60, active: 70 },
    { time: "10 AM", evening: 40, lunch: 80, active: 75 },
    { time: "12 PM", evening: 50, lunch: 95, active: 80 },
    { time: "2 PM", evening: 55, lunch: 70, active: 75 },
    { time: "4 PM", evening: 65, lunch: 40, active: 70 },
    { time: "6 PM", evening: 95, lunch: 20, active: 80 },
    { time: "8 PM", evening: 85, lunch: 15, active: 75 },
    { time: "10 PM", evening: 60, lunch: 10, active: 60 },
    { time: "11 PM", evening: 30, lunch: 5, active: 40 }
  ];

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#EEEEFF] font-body text-[#1A1A2E] pb-12">
      {/* 1. HEADER */}
      <header className="bg-white px-6 py-3 flex items-center justify-between border-b border-[#E8E6FF] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn"><Shield className="h-4.5 w-4.5 text-white" /></div>
          <span className="text-xl font-headline font-bold">Gig<span className="text-[#6C47FF]">Shield</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 bg-[#f0f2f9] text-[#6C47FF] rounded-xl"><Home className="h-4.5 w-4.5" /></Button>
          <Link href="/claims"><Button variant="ghost" size="icon" className="h-9 w-9 text-[#64748B] rounded-xl"><FileText className="h-4.5 w-4.5" /></Button></Link>
          <Link href="/heatmap"><Button variant="ghost" size="icon" className="h-9 w-9 text-[#64748B] rounded-xl"><MapIcon className="h-4.5 w-4.5" /></Button></Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="h-9 w-9 text-[#EF4444] rounded-xl"><LogOut className="h-4.5 w-4.5" /></Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Welcome, {profile?.name || "User"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
              <p className="text-xs text-[#64748B] font-medium">Active on {profile?.platform || 'Delivery'} in {profile?.city || 'Chennai'}</p>
            </div>
          </div>
          <Button 
            onClick={handleSimulateWeather} 
            disabled={simulating}
            className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold rounded-xl shadow-btn h-10 px-5 text-sm"
          >
            {simulating ? <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" /> : <Zap className="mr-2 h-3.5 w-3.5 fill-current" />}
            Simulate Severe Weather
          </Button>
        </div>

        {/* 2. TOP SECTION: 3 CARDS SIDE BY SIDE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active Protection */}
          <Card className="bg-[#6C47FF] text-white rounded-[24px] border-none p-6 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[200px]">
            <Shield className="absolute top-6 right-6 h-7 w-7 opacity-40" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Active Protection</p>
              <h2 className="text-2xl font-black uppercase">{profile?.plan_id?.toUpperCase() || "PRO"} SHIELD</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
                <p className="text-[8px] font-bold uppercase opacity-60 mb-0.5">Max Payout</p>
                <p className="text-sm font-bold">₹{metrics.coverage}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
                <p className="text-[8px] font-bold uppercase opacity-60 mb-0.5">Premium</p>
                <p className="text-base font-black">₹{metrics.premium}</p>
              </div>
            </div>
          </Card>

          {/* Card 2: AI Risk Prediction */}
          <Card className="bg-white rounded-[24px] border border-[#E8E6FF] p-6 flex flex-col justify-between shadow-sm relative min-h-[200px]">
            <Brain className="absolute top-6 right-6 h-5 w-5 text-[#6C47FF]" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8] mb-1">AI Risk Prediction</p>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-3xl font-black text-[#1A1A2E]">{weatherData.rainfall}mm</h2>
                <Badge className="bg-[#DCFCE7] text-[#22C55E] hover:bg-[#DCFCE7] border-none font-bold py-0.5 px-2.5 rounded-lg text-[10px]">{weatherData.description}</Badge>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[#64748B]">Disruption Risk</span>
                  <span className="text-[#1A1A2E]">{disruptionRisk}%</span>
                </div>
                <Progress value={disruptionRisk} className="h-2 bg-[#f0f2f9]" />
              </div>

              <div className="space-y-2 pt-2 border-t border-[#f0f2f9]">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[#64748B]">Live Risk Score</span>
                  <span className={riskScore > 60 ? "text-[#EF4444]" : riskScore > 30 ? "text-[#F59E0B]" : "text-[#22C55E]"}>
                    {riskScore}/100
                  </span>
                </div>
                <div className="h-2 w-full bg-[#f0f2f9] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${riskScore}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: riskScore > 60 ? "#EF4444" : riskScore > 30 ? "#F59E0B" : "#22C55E" 
                    }}
                  />
                </div>
                {riskScore > 90 && (
                  <motion.p 
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-[9px] font-black text-[#EF4444] uppercase tracking-tighter text-center"
                  >
                    ⚡ CLAIM MAY AUTO-FIRE!
                  </motion.p>
                )}
              </div>
            </div>
          </Card>

          {/* Card 3: Commitment Status */}
          <Card className="bg-[#FEFCE8] rounded-[24px] border border-[#FEF08A] p-6 flex flex-col justify-between shadow-sm relative min-h-[200px]">
            <RefreshCcw className="absolute top-6 right-6 h-5 w-5 text-[#F59E0B]" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#F59E0B] mb-1">Commitment Status</p>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-black text-[#1A1A2E]">Week 1 of 4</h2>
                <Badge className="bg-[#DCFCE7] text-[#22C55E] hover:bg-[#DCFCE7] border-none font-bold py-0.5 px-2.5 rounded-lg text-[9px]">Renewal ON</Badge>
              </div>
              <p className="text-[11px] font-bold text-[#64748B] italic mt-3">Next Renewal: 25 Mar</p>
            </div>
          </Card>
        </div>

        {/* 3. POLICY MANAGEMENT: TITLE + 4 MINI CARDS INSIDE SAME BOX */}
        <section>
          <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm overflow-hidden p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-bold text-[#1A1A2E]">Policy Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "ACTIVATION DATE", value: profile?.plan_activated_at?.seconds ? format(new Date(profile.plan_activated_at.seconds * 1000), "dd MMM") : "Just now", icon: <Calendar className="h-4 w-4 text-[#6C47FF]" /> },
                  { label: "NEXT RENEWAL", value: "25 Mar", icon: <RefreshCcw className="h-4 w-4 text-[#F59E0B]" /> },
                  { label: "RENEWAL AMOUNT", value: `₹${metrics.premium || 0}`, icon: <IndianRupee className="h-4 w-4 text-[#22C55E]" /> },
                  { label: "COMMITMENT", value: "4 Weeks", icon: <Shield className="h-4 w-4 text-[#6C47FF]" /> }
                ].map((item) => (
                  <Card key={item.label} className="bg-white border-none rounded-[20px] shadow-sm p-4 flex flex-col gap-2 relative overflow-hidden border border-[#F5F3FF]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#F8F9FF] rounded-lg">
                        {item.icon}
                      </div>
                      <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-wider">{item.label}</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-[#1A1A2E]">{item.value}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. EARNINGS PROTECTION SUMMARY: FULL WIDTH CARD */}
        <section>
          <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm overflow-hidden p-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2 px-1">
              <h2 className="text-lg font-bold text-[#1A1A2E]">Earnings Protection Summary</h2>
              <Badge className="bg-[#6C47FF] text-white rounded-full px-3 py-1 font-bold border-none text-[10px] uppercase tracking-widest">
                DNA Rate: ₹{activeRate}/hr ({activeSlotName})
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-1">
              <div className="flex flex-col space-y-1 p-4 bg-[#FEE2E2]/30 rounded-2xl">
                <p className="text-[11px] font-black text-[#EF4444] uppercase tracking-widest">POTENTIAL INCOME LOSS</p>
                <p className="text-2xl font-black text-[#EF4444]">₹{metrics.incomeLoss || 0}</p>
                <p className="text-[10px] text-[#64748B] leading-[1.4] mt-1 italic">AI-calculated disruption risk</p>
              </div>
              <div className="flex flex-col space-y-1 p-4 bg-[#DCFCE7]/30 rounded-2xl">
                <p className="text-[11px] font-black text-[#22C55E] uppercase tracking-widest">INSURANCE COVERAGE</p>
                <p className="text-2xl font-black text-[#22C55E]">₹{metrics.coverage || 0}</p>
                <p className="text-[10px] text-[#64748B] leading-[1.4] mt-1 italic">Capped by {profile?.plan_id?.toUpperCase() || 'PRO'} plan</p>
              </div>
              <div className="flex flex-col space-y-1 p-4 bg-[#F1F0FF] rounded-2xl">
                <p className="text-[11px] font-black text-[#6C47FF] uppercase tracking-widest">REMAINING RISK</p>
                <p className="text-2xl font-black text-[#6C47FF]">₹{metrics.remainingRisk || 0}</p>
                <p className="text-[10px] text-[#64748B] leading-[1.4] mt-1 italic">Net financial gap</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 5. INCOME DNA PROFILE SECTION */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Income DNA Profile</h2>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Updated {format(new Date(), "HH:mm")}</p>
          </div>

          {/* Time Slot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "MORNING", time: "6-10 AM", rate: morningRate, icon: "🌅", color: "#F59E0B", mult: "0.75x" },
              { label: "AFTERNOON", time: "12-4 PM", rate: afternoonRate, icon: "☀️", color: "#EAB308", mult: "0.95x" },
              { label: "EVENING", time: "5-9 PM", rate: eveningRate, icon: "🌆", color: "#6C47FF", mult: "1.30x", peak: true },
              { label: "NIGHT", time: "9 PM-12 AM", rate: nightRate, icon: "🌙", color: "#3B82F6", mult: "0.85x" }
            ].map((slot) => (
              <Card key={slot.label} className="bg-white border-none rounded-[20px] shadow-sm p-4 flex flex-col gap-1 relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{slot.icon}</span>
                  <p className="text-[9px] font-black text-[#64748B] uppercase">{slot.label}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#64748B]">{slot.time}</p>
                  <p className="text-xl font-bold text-[#1A1A2E]">₹{slot.rate}/hr</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#6C47FF]">{slot.mult} multiplier</p>
                  {slot.peak && <Badge className="bg-[#6C47FF] text-white text-[7px] font-black uppercase px-1 py-0 border-none">Peak</Badge>}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: slot.color }} />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-none rounded-[24px] shadow-sm p-8 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Expected Weekly Earnings</p>
                <h3 className="text-5xl font-black text-[#6C47FF]">₹{Math.round((morningRate * 4 + afternoonRate * 4 + eveningRate * 4 + nightRate * 3) * 7)}</h3>
                <p className="text-[11px] text-[#64748B] leading-relaxed mt-4 max-w-sm">Derived from your Income DNA earning pattern across projected working hours.</p>
              </div>
              <div className="mt-8 pt-8 border-t border-[#E8E6FF] flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter mb-1">Recommended Plan</p>
                  <p className="text-xl font-bold text-[#F59E0B]">Pro Shield</p>
                </div>
                <Button variant="outline" className="border-2 border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#6C47FF] hover:text-white rounded-xl h-12 px-8 transition-all text-sm">Upgrade Plan</Button>
              </div>
            </Card>

            <Card className="bg-white border-none rounded-[24px] shadow-sm p-8">
              <h3 className="text-sm font-bold text-[#1A1A2E] mb-6">Peak Earning Hours (24-Hour Profile)</h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLunch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="evening" stroke="#6C47FF" strokeWidth={2} fillOpacity={1} fill="url(#colorEvening)" />
                    <Area type="monotone" dataKey="lunch" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorLunch)" />
                    <Area type="monotone" dataKey="active" stroke="#94A3B8" strokeWidth={1} fill="none" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex justify-center gap-8">
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#6C47FF]" /><span className="text-[9px] font-bold text-[#94A3B8] uppercase">Evening peak</span></div>
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#F59E0B]" /><span className="text-[9px] font-bold text-[#94A3B8] uppercase">Lunch peak</span></div>
                <div className="flex items-center gap-2"><div className="h-0.5 w-3 border-t border-dashed border-[#94A3B8]" /><span className="text-[9px] font-bold text-[#94A3B8] uppercase">Active hours</span></div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Link href="/support">
        <Button className="fixed bottom-8 right-8 h-14 w-14 bg-[#6C47FF] rounded-full shadow-2xl flex items-center justify-center text-white z-50 hover:scale-110 transition-all active:scale-95">
          <Brain className="h-7 w-7" />
        </Button>
      </Link>
      
      <AnimatePresence>{notif && <ClaimNotification claim={notif} onDismiss={() => setNotif(null)} onView={() => router.push('/claims')} />}</AnimatePresence>
    </div>
  );
}
