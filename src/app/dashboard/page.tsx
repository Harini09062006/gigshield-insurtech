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
  MapPin
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
import { doc, addDoc, collection, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ClaimNotification } from "@/components/ClaimNotification";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Helper function for Weekly Risk Score
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
  else score = 5
  
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

/**
 * Calculates the dynamic premium breakdown based on weekly risk rules.
 */
const calculatePremiumBreakdown = (workerCity: string, rainfall: number, basePremium: number, riskScore: number) => {
  // Weekly Location Surcharge
  const locationCharge = workerCity === "Chennai" ? 3 : 0;
  
  // Weekly Weather Risk Surcharge (Rainfall as weekly proxy)
  const weatherCharge = rainfall > 50 ? 2 : 0;
  
  // Weekly Safe Zone Discount (Low Risk < 40)
  const safeZoneDiscount = riskScore < 40 ? 3 : 0;
  
  return {
    basePremium,
    locationCharge,
    weatherCharge,
    safeZoneDiscount,
    finalPremium: Math.max(1, basePremium + locationCharge + weatherCharge - safeZoneDiscount)
  };
};

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [simulating, setSimulating] = useState(false);
  const [notif, setNotif] = useState<any>(null);
  
  const [weatherData, setWeatherData] = useState({
    rainfall: 12,
    description: "Light Rain",
    temperature: 28,
    aqi: 85,
    wind: 15,
    visibility: 800
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

  const breakdown = React.useMemo(() => {
    if (!profile) return { basePremium: 25, locationCharge: 0, weatherCharge: 0, safeZoneDiscount: 0, finalPremium: 25 };
    const plan = profile.plan_id ?? "pro";
    const baseVal = plan === "basic" ? 10 : plan === "elite" ? 50 : 25;
    return calculatePremiumBreakdown(profile.city || "", weatherData.rainfall, baseVal, riskScore);
  }, [profile, weatherData.rainfall, riskScore]);

  const metrics = React.useMemo(() => {
    if (!profile) return { incomeLoss: 0, coverage: 0, remainingRisk: 0, premium: 0, riskScore: 35 };

    const riskScoreValue = profile.riskScore ?? 35;
    const plan = profile.plan_id ?? "pro";
    
    const baseRate = profile.avg_hourly_earnings ?? 60;
    const incomeLoss = Math.round((baseRate * 1.3) * 3 * (riskScoreValue / 100));
    const coverage = plan === "basic" ? 60 : plan === "pro" ? 240 : 600;
    
    const premium = breakdown.finalPremium;
    const remainingRisk = Math.max(0, incomeLoss - coverage);

    return { incomeLoss, coverage, remainingRisk, premium, riskScore: riskScoreValue };
  }, [profile, breakdown.finalPremium]);

  const getRiskInfo = (env: any) => {
    const rainStatus = env.rainfall < 30 ? { label: "LOW", score: 0, color: "bg-emerald-50 text-emerald-600" } 
                     : env.rainfall <= 60 ? { label: "MEDIUM", score: 1, color: "bg-amber-50 text-amber-600" } 
                     : { label: "HIGH", score: 2, color: "bg-red-50 text-red-600" };

    const aqiStatus = env.aqi < 100 ? { label: "SAFE", score: 0, color: "bg-emerald-50 text-emerald-600" } 
                    : env.aqi <= 300 ? { label: "MODERATE", score: 1, color: "bg-amber-50 text-amber-600" } 
                    : { label: "HIGH", score: 2, color: "bg-red-50 text-red-600" };

    const tempStatus = env.temperature < 35 ? { label: "NORMAL", score: 0, color: "bg-emerald-50 text-emerald-600" } 
                     : env.temperature <= 40 ? { label: "WARNING", score: 1, color: "bg-amber-50 text-amber-600" } 
                     : { label: "HIGH", score: 2, color: "bg-red-50 text-red-600" };

    const windStatus = env.wind < 30 ? { label: "SAFE", score: 0, color: "bg-emerald-50 text-emerald-600" } 
                     : env.wind <= 50 ? { label: "WARNING", score: 1, color: "bg-amber-50 text-amber-600" } 
                     : { label: "HIGH", score: 2, color: "bg-red-50 text-red-600" };

    const fogStatus = env.visibility > 500 ? { label: "CLEAR", score: 0, color: "bg-emerald-50 text-emerald-600" } 
                    : env.visibility >= 200 ? { label: "LOW", score: 1, color: "bg-amber-50 text-amber-600" } 
                    : { label: "HIGH", score: 2, color: "bg-red-50 text-red-600" };

    const totalScore = rainStatus.score + aqiStatus.score + tempStatus.score + windStatus.score + fogStatus.score;
    const overall = totalScore >= 5 ? "HIGH" : totalScore >= 3 ? "MEDIUM" : "LOW";
    const overallColor = overall === "HIGH" ? "text-red-600" : overall === "MEDIUM" ? "text-amber-600" : "text-emerald-600";

    return { rain: rainStatus, aqi: aqiStatus, temp: tempStatus, wind: windStatus, visibility: fogStatus, overall, overallColor };
  };

  const riskInfo = getRiskInfo(weatherData);

  const getAllPassedChecks = () => ({
    gpsValidation: "PASSED",
    deviceCheck: "PASSED",
    accountAge: "PASSED",
    behaviorPattern: "PASSED",
    orderHistory: "PASSED",
    duplicateCheck: "PASSED",
    weatherIntelligence: "PASSED",
    networkAnalysis: "PASSED"
  });

  const handleSimulateWeather = async () => {
    if (!user?.uid || !db) return;
    
    setSimulating(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      
      const currentCount = userData?.simulationCount || 0;
      const newCount = currentCount + 1;

      const isFirst = newCount === 1;
      const isSecond = newCount === 2;
      const isThirdOrMore = newCount >= 3;
      
      const API_KEY = "be5f61ff6b261dedfa89e321d466a063";
      const realWeatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${profile?.city || "Chennai"},IN&units=metric&appid=${API_KEY}`
      );
      const realWeatherData = await realWeatherRes.json();
      
      const severeRainfall = 65;
      const newRisk = isFirst ? 75 : isSecond ? 85 : 95;

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
      
      let claimStatus = "paid";
      let payoutStatus = "PAID";
      let decision = "APPROVED";
      let trustScore = 95;
      let findings = ["All checks passed"];
      let fraudResults = getAllPassedChecks();
      let triggerDesc = isFirst ? `Severe Rainfall (${severeRainfall}mm) Simulated` : `Simulation Trigger: State ${newCount}`;

      if (isSecond) {
        claimStatus = "review";
        payoutStatus = "PENDING";
        decision = "REVIEW";
        trustScore = 60;
        findings = ["Duplicate claim suspected", "Verification required"];
        triggerDesc = `Duplicate Simulation Trigger (Anomaly Detected)`;
        fraudResults = {
          ...getAllPassedChecks(),
          duplicateCheck: "SUSPICIOUS"
        };
      } else if (isThirdOrMore) {
        claimStatus = "failed";
        payoutStatus = "REJECTED";
        decision = "BLOCKED";
        trustScore = 45;
        findings = ["Duplicate claim detected", "Behavior anomaly detected"];
        triggerDesc = `Critical Risk Alert: Behavioral Anomaly`;
        fraudResults = {
          ...getAllPassedChecks(),
          duplicateCheck: "FAILED",
          behaviorPattern: "FAILED"
        };
      }
      
      // Create claim in Firebase
      await addDoc(collection(db, "claims"), {
        worker_id: user.uid,
        userId: user.uid,
        trigger_type: "SEVERE_RAIN",
        trigger_description: triggerDesc,
        dna_time_slot: timeSlot,
        dna_hourly_rate: Math.round(baseRate * multiplier),
        compensation: Math.round(compensation),
        status: claimStatus,
        payoutStatus: payoutStatus,
        decision: decision,
        fraudChecks: fraudResults,
        trustScore: trustScore,
        findings: findings,
        weather: {
          rainfall: severeRainfall,
          temperature: realWeatherData.main?.temp || 28,
          condition: "Storm"
        },
        createdAt: serverTimestamp()
      });

      // Update user profile with simulation count and latest results
      await updateDoc(userRef, {
        simulationCount: newCount,
        riskScore: newRisk,
        lastSimulation: Date.now(),
        updatedAt: serverTimestamp()
      });

      setWeatherData({
        rainfall: severeRainfall,
        description: isFirst ? "Severe Rainfall" : isSecond ? "Anomaly Detected" : "Simulation Blocked",
        temperature: realWeatherData.main?.temp || 28,
        aqi: isFirst ? 350 : 420,
        wind: isFirst ? 55 : 65,
        visibility: isFirst ? 150 : 80
      });
      setDisruptionRisk(newRisk);

      let toastTitle = "⚡ Simulation Success!";
      let toastDesc = `Severe weather detected. ₹${Math.round(compensation)} PAID INSTANTLY!`;

      if (isSecond) {
        toastTitle = "⚠️ Verification Required";
        toastDesc = "Potential duplicate claim detected. Under manual review.";
      } else if (isThirdOrMore) {
        toastTitle = "❌ Claim Rejected";
        toastDesc = "Fraudulent patterns detected. This event has been logged.";
      }

      toast({
        title: toastTitle,
        description: toastDesc
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

        {/* 2. TOP SECTION: 2 CARDS SIDE BY SIDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Active Protection (Compact) */}
          <Card className="bg-[#6C47FF] text-white rounded-[24px] border-none p-4 shadow-xl relative overflow-hidden flex flex-col gap-3">
            <Shield className="absolute top-4 right-4 h-6 w-6 opacity-20" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-0.5">Active Plan</p>
                  <h2 className="text-sm font-black uppercase">{profile?.plan_id?.toUpperCase() || "PRO"} SHIELD</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 opacity-70" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Location: {profile?.city || 'Chennai'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-0.5">Max Payout</p>
                  <p className="text-[10px] font-bold">₹{metrics.coverage}</p>
                </div>
              </div>

              <div className="text-center mb-3">
                <p className="text-4xl font-black mb-0.5">₹{breakdown.finalPremium}</p>
                <div className="flex flex-col items-center gap-0.5">
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-60">📊 AI Calculated Premium</p>
                  <p className="text-[8px] opacity-50 italic">Based on weekly location & weather risk</p>
                </div>
              </div>

              {/* Before -> After & Status */}
              <div className="text-center space-y-0.5 mb-3">
                <p className="text-[9px] font-bold opacity-80">
                  Base: ₹{breakdown.basePremium} → Now: ₹{breakdown.finalPremium}
                </p>
                {riskScore > 60 ? (
                  <p className="text-[8px] font-black text-[#FEE2E2] uppercase tracking-tighter">
                    ⬆ Increased due to weekly risk
                  </p>
                ) : riskScore < 40 ? (
                  <p className="text-[8px] font-black text-[#DCFCE7] uppercase tracking-tighter">
                    ✓ Lower premium (Safe Zone)
                  </p>
                ) : (
                  <p className="text-[8px] font-black text-[#DCFCE7] uppercase tracking-tighter">
                    ✓ Stable pricing (Normal Conditions)
                  </p>
                )}
              </div>

              <div className="space-y-1 bg-black/10 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="opacity-70">Base</span>
                  <span>₹{breakdown.basePremium}</span>
                </div>
                {breakdown.locationCharge > 0 && (
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="opacity-70">Location Risk ({profile?.city || 'Zone'})</span>
                    <span>+₹{breakdown.locationCharge}</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="opacity-70">
                      {breakdown.weatherCharge > 0 ? `Rain: ${weatherData.rainfall}mm (HIGH risk)` : "Weather Risk (Rain)"}
                    </span>
                    <span>
                      {breakdown.weatherCharge > 0 ? `→ +₹${breakdown.weatherCharge}` : "No extra cost (Low Risk)"}
                    </span>
                  </div>
                  {breakdown.weatherCharge > 0 && (
                    <p className="text-[8px] opacity-50 italic text-right">
                      Threshold: {'>'}50mm rainfall triggers risk adjustment
                    </p>
                  )}
                </div>
                {breakdown.safeZoneDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="opacity-70 text-[#DCFCE7]">Safe Zone Discount</span>
                    <span className="text-[#DCFCE7]">-₹{breakdown.safeZoneDiscount}</span>
                  </div>
                )}
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-center items-center">
                  <span className="text-sm font-black text-[#DCFCE7]">₹{breakdown.finalPremium} / week ✅</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: AI Risk Prediction (Multi-Risk Monitoring) */}
          <Card className="bg-white rounded-[24px] border border-[#E8E6FF] p-4 flex flex-col justify-between shadow-sm relative h-full">
            <Brain className="absolute top-4 right-4 h-6 w-6 text-[#6C47FF] opacity-20" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#94A3B8] mb-0.5">AI Risk Prediction</p>
                  <p className="text-[8px] font-bold text-[#6C47FF] uppercase">Real-time Risk Analysis</p>
                </div>
                <Badge className={`${riskInfo.overall === 'HIGH' ? 'bg-red-50 text-red-500' : riskInfo.overall === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'} border-none font-bold py-0.5 px-2 rounded-lg text-[9px]`}>
                  {riskInfo.overall === 'HIGH' ? "High Risk Condition ⚠️" : riskInfo.overall === 'MEDIUM' ? "Moderate Alert 🟠" : "Safe Environment ✅"}
                </Badge>
              </div>
              
              {/* Multi-Risk Rows */}
              <div className="space-y-1.5 mt-2">
                {[
                  { icon: "🌧️", label: "Rain", val: `${weatherData.rainfall}mm`, status: riskInfo.rain },
                  { icon: "🌫️", label: "AQI", val: weatherData.aqi, status: riskInfo.aqi },
                  { icon: "🌡️", label: "Temp", val: `${weatherData.temperature}°C`, status: riskInfo.temp },
                  { icon: "🌬️", label: "Wind", val: `${weatherData.wind} km/h`, status: riskInfo.wind },
                  { icon: "🌁", label: "Fog", val: `${weatherData.visibility}m`, status: riskInfo.visibility },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-[#F5F3FF] last:border-none">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{row.icon}</span>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-[#1A1A2E]">{row.val}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${row.status.color}`}>
                        {row.status.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#94A3B8]">🧠 Overall Risk:</span>
                <span className={riskInfo.overallColor}>{riskInfo.overall}</span>
              </div>
            </div>

            {/* AI Insights Section - Compact Refinement */}
            <div className="mt-3 space-y-1.5 border-t border-b border-[#f0f2f9] py-2.5">
              <div className="flex items-start gap-1.5 leading-tight">
                <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest whitespace-nowrap pt-0.5">📊 Prediction:</span>
                <span className="text-[10px] font-bold text-[#1A1A2E]">
                  {riskInfo.overall === 'HIGH' ? "Severe disruptions expected for next few hours" : riskInfo.overall === 'MEDIUM' ? "Variable conditions predicted; monitoring active" : "Stable atmospheric conditions predicted"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 leading-tight">
                <div className="flex items-start gap-1.5">
                  <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest whitespace-nowrap pt-0.5">⚡ System Action:</span>
                  <span className="text-[10px] font-bold text-[#6C47FF]">
                    {riskInfo.overall === 'HIGH' ? "Premium increased; High-alert status" : riskInfo.overall === 'MEDIUM' ? "Monitoring active; standard rates" : "Premium reduced; Safe Zone Active" }
                  </span>
                </div>
                <p className="text-[9px] font-medium text-[#64748B] opacity-70 ml-[82px] -mt-0.5">
                  Automated verification enabled for all factors
                </p>
                <div className="flex flex-col gap-0.5 mt-1 ml-[82px]">
                  <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest opacity-80">Premium Impact:</span>
                  <p className="text-[9px] font-bold text-[#64748B]">Rain ({weatherData.rainfall}mm {riskInfo.rain.label}) → +₹{breakdown.weatherCharge}</p>
                  <p className="text-[9px] font-bold text-[#64748B]">AQI ({weatherData.aqi} {riskInfo.aqi.label}) → +₹0</p>
                  <p className="text-[9px] font-bold text-[#64748B]">Wind ({weatherData.wind} km/h {riskInfo.wind.label}) → +₹0</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-[#64748B]">Disruption Risk</span>
                  <span className="text-[#1A1A2E]">{disruptionRisk}%</span>
                </div>
                <Progress value={disruptionRisk} className="h-1.5 bg-[#f0f2f9]" />
              </div>

              <div className="space-y-1 pt-2 border-t border-[#f0f2f9]">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-[#64748B]">Live Risk Score</span>
                  <span className={riskScore > 60 ? "text-[#EF4444]" : riskScore > 30 ? "text-[#F59E0B]" : "text-[#22C55E]"}>
                    {riskScore}/100
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#f0f2f9] rounded-full overflow-hidden">
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
              </div>
            </div>
          </Card>
        </div>

        {/* 3. POLICY MANAGEMENT */}
        <section>
          <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm overflow-hidden p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold text-[#1A1A2E]">Policy Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                {[
                  { label: "ACTIVATION", value: profile?.plan_activated_at?.seconds ? format(new Date(profile.plan_activated_at.seconds * 1000), "dd MMM") : "Just now", icon: <Calendar className="h-4 w-4 text-[#6C47FF]" /> },
                  { label: "RENEWAL", value: "25 Mar", icon: <RefreshCcw className="h-4 w-4 text-[#F59E0B]" /> },
                  { label: "PREMIUM", value: `₹${breakdown.finalPremium}`, icon: <IndianRupee className="h-4 w-4 text-[#22C55E]" /> },
                  { label: "COMMITMENT", value: "4 Weeks", icon: <Shield className="h-4 w-4 text-[#6C47FF]" /> }
                ].map((item) => (
                  <Card key={item.label} className="bg-white border border-[#F5F3FF] rounded-[20px] shadow-sm p-3 flex flex-col gap-2 relative overflow-hidden">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-[#F8F9FF] rounded-lg flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <p className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">{item.label}</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-[#1A1A2E]">{item.value}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. EARNINGS PROTECTION SUMMARY */}
        <section>
          <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm overflow-hidden p-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2 px-1">
              <h2 className="text-lg font-bold text-[#1A1A2E]">Earnings Protection Summary</h2>
              <Badge className="bg-[#6C47FF] text-white rounded-full px-3 py-1 font-bold border-none text-[10px] uppercase tracking-widest">
                DNA Rate: ₹{activeRate}/hr
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-1">
              <div className="flex flex-col space-y-1 p-4 bg-[#FEE2E2]/30 rounded-2xl">
                <p className="text-[9px] font-black text-[#EF4444] uppercase tracking-widest">POTENTIAL INCOME LOSS</p>
                <p className="text-2xl font-black text-[#EF4444]">₹{metrics.incomeLoss || 0}</p>
              </div>
              <div className="flex flex-col space-y-1 p-4 bg-[#DCFCE7]/30 rounded-2xl">
                <p className="text-[9px] font-black text-[#22C55E] uppercase tracking-widest">INSURANCE COVERAGE</p>
                <p className="text-2xl font-black text-[#22C55E]">₹{metrics.coverage || 0}</p>
              </div>
              <div className="flex flex-col space-y-1 p-4 bg-[#F1F0FF] rounded-2xl">
                <p className="text-[9px] font-black text-[#6C47FF] uppercase tracking-widest">REMAINING RISK</p>
                <p className="text-2xl font-black text-[#6C47FF]">₹{metrics.remainingRisk || 0}</p>
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
                  <p className="text-xs font-bold text-[#6C47FF]">{slot.mult} multiplier</p>
                  {slot.peak && <Badge className="bg-[#6C47FF] text-white text-[7px] font-black uppercase px-1 py-0 border-none">Peak</Badge>}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: slot.color }} />
              </Card>
            ))}
          </div>

          {/* Unified Row: Graph and Earnings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-2">
              <Card className="bg-white border-none rounded-[24px] shadow-sm p-4 h-full flex flex-col justify-between">
                <h3 className="text-sm font-bold text-[#1A1A2E] mb-6">Peak Earning Hours (24-Hour Profile)</h3>
                <div className="h-[260px] w-full">
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

            <div className="lg:col-span-1">
              <Card className="bg-white border-none rounded-[24px] shadow-sm p-4 h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Expected Weekly Earnings</p>
                  <h3 className="text-3xl font-black text-[#6C47FF]">₹{Math.round((morningRate * 4 + afternoonRate * 4 + eveningRate * 4 + nightRate * 3) * 7)}</h3>
                  <p className="text-[11px] text-[#64748B] leading-relaxed mt-4">Derived from your Income DNA earning pattern across projected working hours.</p>
                </div>
                <div className="mt-8 pt-8 border-t border-[#E8E6FF] flex flex-col gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-tighter mb-1">Recommended Plan</p>
                    <p className="text-xl font-bold text-[#F59E0B]">Pro Shield</p>
                  </div>
                  <Link href="/plans"><Button variant="outline" className="w-full border-2 border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#6C47FF] hover:text-white rounded-xl h-12 transition-all text-sm">Upgrade Plan</Button></Link>
                </div>
              </Card>
            </div>
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
