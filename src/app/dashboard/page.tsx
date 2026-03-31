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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, getDocs, query, where, limit, updateDoc, getDoc, type Firestore } from "firebase/firestore";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { AIAssistant } from "@/components/chatbot/AIAssistant";
import { ClaimNotification } from "@/components/ClaimNotification";
import { useRouter } from "next/navigation";
import { getUserLocation } from "@/services/locationService";
import { useToast } from "@/hooks/use-toast";
import { autoUpdatePremium } from "@/services/aiAutoUpdater";
import { format } from "date-fns";

// API Configuration
const WEATHER_API_KEY = "be5f61ff6b261dedfa89e321d466a063";

// GLOBAL TRACKER FOR DEMO PERSISTENCE
let lastProcessedEventId: string | null = null;

interface WeatherData {
  rainfall: number;
  temperature: number;
  aqi: number;
  windSpeed: number;
  humidity: number;
  visibility: number;
  timestamp: string;
  source: "REAL" | "SIMULATED";
  city: string;
}

interface DisruptionTrigger {
  type: string;
  severity: "EXTREME" | "HIGH" | "MEDIUM" | "LOW";
  value: number;
  unit: string;
  threshold: number;
  description: string;
}

interface ClaimObject {
  worker_id: string;
  userId: string;
  eventId: string;
  trigger_type: string;
  trigger_description: string;
  trigger_severity: string;
  weather_data: WeatherData;
  timeSlot: string;
  baseRate: number;
  multiplier: number;
  hoursLost: number;
  compensation: number;
  status: string;
  source: string;
  created_at: string;
}

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [chatOpen, setChatOpen] = useState(false);
  const [notif, setNotif] = useState<any>(null);
  
  const [weather, setWeather] = useState({
    rainMM: 12,
    condition: "Light Rain",
    risk: 35
  });

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

  /**
   * CORE INSURANCE CALCULATION ENGINE
   * Synthesizes Income DNA and Risk Score into protection metrics.
   */
  const calculateAndUpdateInsurance = async (userData: any, userId: string) => {
    if (!userData || !userId || !db) return;

    const dna = userData.dna;
    const riskScore = userData.riskScore || 30;
    const plan = userData.plan_id || userData.plan || "pro";

    // PREMIUM (AI logic)
    let premium = (dna.weeklyIncome * riskScore) / 1000;
    premium = Math.max(20, Math.min(80, premium));
    premium = Math.round(premium);

    // INCOME LOSS
    const incomeLoss = Math.round(dna.weeklyIncome * (riskScore / 100));

    // COVERAGE
    const coverage =
      plan === "basic" ? 60 :
      plan === "pro" ? 240 :
      600;

    // REMAINING RISK
    const remainingRisk = Math.max(0, incomeLoss - coverage);

    console.log("CALCULATED VALUES:", {
      premium,
      incomeLoss,
      coverage,
      remainingRisk
    });

    // SAFE UPDATE
    await updateDoc(doc(db, "users", userId), {
      premium,
      incomeLoss,
      coverage,
      remainingRisk,
      lastUpdated: Date.now()
    });
  };

  /**
   * DATA HYDRATION AND SYNC
   * Ensures DNA exists and triggers calculations on load.
   */
  useEffect(() => {
    async function syncData() {
      if (user && profile && db) {
        // STEP 1: Ensure DNA exists in Firestore
        if (!profile.dna) {
          console.warn("DNA missing — initializing default DNA");
          await updateDoc(doc(db, "users", user.uid), {
            dna: {
              morning: 45,
              afternoon: 57,
              evening: 78,
              night: 51,
              weeklyIncome: 3360
            }
          });
          return;
        }

        // STEP 2: Trigger calculation on data load
        calculateAndUpdateInsurance(profile, user.uid);
        autoUpdatePremium(db, user.uid, profile);
      }
    }
    syncData();
  }, [user, profile, db]);

  const fetchWeather = async () => {
    try {
      const position = await getUserLocation().catch(() => null);
      const lat = position?.lat || 19.0760;
      const lon = position?.lng || 72.8777;
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
      const data = await res.json();
      const rain = data.rain?.['1h'] || 0;
      const risk = rain > 20 ? 85 : rain > 5 ? 45 : 15;
      setWeather({
        rainMM: Math.round(rain) || 12,
        condition: data.weather[0]?.main || "Light Rain",
        risk: risk || 35
      });
    } catch (e) {
      console.error("Weather fetch error", e);
    }
  };

  const processClaim = async (claim: ClaimObject): Promise<void> => {
    let trustScore = 100;
    const fraudChecks: Record<string, string> = {};
    let isDuplicate = lastProcessedEventId === claim.eventId;

    try {
      const gps = await new Promise<{lat:number,lng:number}|null>(resolve => {
        navigator.geolocation.getCurrentPosition(p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }), () => resolve(null), { timeout: 3000 });
      });
      fraudChecks.gpsValidation = gps ? "PASSED" : "SUSPICIOUS";
      if (!gps) trustScore -= 15;
    } catch { fraudChecks.gpsValidation = "SUSPICIOUS"; trustScore -= 15; }

    try {
      const dupSnap = await getDocs(query(collection(db, "claims"), where("worker_id", "==", claim.worker_id), where("eventId", "==", claim.eventId)));
      fraudChecks.duplicateCheck = (dupSnap.empty && !isDuplicate) ? "PASSED" : "FAILED";
      if (!dupSnap.empty || isDuplicate) trustScore -= 50;
    } catch { fraudChecks.duplicateCheck = "PASSED"; }

    const finalScore = Math.max(0, Math.round(trustScore));
    const decision = finalScore > 70 ? "APPROVED" : finalScore >= 40 ? "REVIEW" : "BLOCKED";

    const finalClaim = {
      ...claim,
      fraudChecks,
      trustScore: finalScore,
      decision,
      status: decision === "APPROVED" ? "paid" : decision === "REVIEW" ? "review" : "failed",
      processingTime: "2.6 seconds"
    };

    await addDoc(collection(db, "claims"), { ...finalClaim, createdAt: serverTimestamp(), created_at: serverTimestamp() });
    lastProcessedEventId = claim.eventId;

    if (decision === 'APPROVED' && profile) {
      setNotif({
        id: "AUTO-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
        amount: claim.compensation,
        trigger: claim.trigger_description,
        timeSlot: claim.timeSlot,
        processingTime: "2.6s",
        workerName: profile.name?.split(' ')[0] || "Worker"
      });
    }
  };

  const createClaim = async (trigger: DisruptionTrigger, weather: WeatherData): Promise<void> => {
    const hour = new Date().getHours();
    const timeSlot = hour >= 6 && hour < 10 ? "Morning Peak" : hour >= 12 && hour < 16 ? "Afternoon Peak": hour >= 17 && hour < 21 ? "Evening Peak" : "Night Shift";
    const multipliers: Record<string, number> = { "Morning Peak": 0.75, "Afternoon Peak": 0.95, "Evening Peak": 1.30, "Night Shift": 0.85 };
    const baseRate = profile?.avg_hourly_earnings || 60;
    const rawAmount = Math.round(baseRate * (multipliers[timeSlot] || 1.0) * 3);
    const compensation = Math.min(rawAmount, profile?.max_payout || 240);
    const eventId = `${weather.city}_${trigger.type}`;

    const claim: ClaimObject = {
      worker_id: user?.uid || "",
      userId: user?.uid || "",
      eventId,
      trigger_type: trigger.type,
      trigger_description: trigger.description,
      trigger_severity: trigger.severity,
      weather_data: weather,
      timeSlot,
      baseRate,
      multiplier: multipliers[timeSlot] || 1.0,
      hoursLost: 3,
      compensation,
      status: "PENDING",
      source: weather.source,
      created_at: new Date().toISOString()
    };
    await processClaim(claim);
  };

  const handleWeatherData = async (weather: WeatherData): Promise<void> => {
    const triggers: DisruptionTrigger[] = [];
    if (weather.rainfall > 50) {
      triggers.push({
        type: "SEVERE_RAIN",
        severity: weather.rainfall > 80 ? "EXTREME" : "HIGH",
        value: weather.rainfall,
        unit: "mm",
        threshold: 50,
        description: `Severe Rainfall ${weather.rainfall}mm detected in ${weather.city}`
      });
    }
    if (triggers.length > 0) {
      const primary = triggers.sort((a, b) => b.value - a.value)[0];
      await createClaim(primary, weather);
    }
  };

  const simulateWeather = async () => {
    if (!user || !profile || !db) return;
    
    const newRisk = 75;
    
    // Update risk score
    await updateDoc(doc(db, "users", user.uid), {
      riskScore: newRisk,
      lastUpdated: Date.now()
    });

    // Recalculate metrics based on new risk
    calculateAndUpdateInsurance({ ...profile, riskScore: newRisk }, user.uid);

    const weatherPayload: WeatherData = {
      rainfall: 80,
      temperature: 35,
      aqi: 120,
      windSpeed: 45,
      humidity: 92,
      visibility: 200,
      timestamp: new Date().toISOString(),
      source: "SIMULATED",
      city: profile.city || "Mumbai"
    };
    
    await handleWeatherData(weatherPayload);
    toast({ title: "AI Risk Re-evaluation", description: `Dynamic protection metrics updated based on simulation. Risk: ${newRisk}%` });
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    if (user) fetchWeather();
  }, [user]);

  // Income DNA variables
  const baseRate = profile?.avg_hourly_earnings || 60;
  const morningRate = Math.round(baseRate * 0.75);
  const afternoonRate = Math.round(baseRate * 0.95);
  const eveningRate = Math.round(baseRate * 1.30);
  const nightRate = Math.round(baseRate * 0.85);

  const currentHour = new Date().getHours();
  let activeSlotName = "Night Shift";
  let activeRate = nightRate;

  if (currentHour >= 6 && currentHour < 10) {
    activeSlotName = "Morning Peak";
    activeRate = morningRate;
  } else if (currentHour >= 12 && currentHour < 16) {
    activeSlotName = "Afternoon Peak";
    activeRate = afternoonRate;
  } else if (currentHour >= 17 && currentHour < 21) {
    activeSlotName = "Evening Peak";
    activeRate = eveningRate;
  }

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
              <p className="text-xs text-[#64748B] font-medium">Active on {profile?.platform || 'Zomato'} in {profile?.city || 'Mumbai'}</p>
            </div>
          </div>
          <Button onClick={simulateWeather} className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold rounded-xl shadow-btn h-10 px-5 text-sm">
            <Zap className="mr-2 h-3.5 w-3.5 fill-current" /> Simulate Severe Weather
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#6C47FF] text-white rounded-[24px] border-none p-6 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[200px]">
            <Shield className="absolute top-6 right-6 h-7 w-7 opacity-40" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Active Protection</p>
              <h2 className="text-2xl font-black uppercase">{profile?.plan_id ? profile.plan_id.toUpperCase() + " SHIELD" : "PRO SHIELD"}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
                <p className="text-[8px] font-bold uppercase opacity-60 mb-0.5">Max Payout</p>
                <p className="text-sm font-black">₹{profile?.coverage || 0}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
                <p className="text-[8px] font-bold uppercase opacity-60 mb-0.5">Premium</p>
                <p className="text-base font-black">₹{profile?.premium || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-[24px] border border-[#E8E6FF] p-6 flex flex-col justify-between shadow-sm relative min-h-[200px]">
            <Brain className="absolute top-6 right-6 h-5 w-5 text-[#6C47FF]" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8] mb-1">AI Risk Prediction</p>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-3xl font-black text-[#1A1A2E]">{weather.rainMM}mm</h2>
                <Badge className="bg-[#DCFCE7] text-[#22C55E] hover:bg-[#DCFCE7] border-none font-bold py-0.5 px-2.5 rounded-lg text-[10px]">{weather.condition}</Badge>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-[#64748B]">Disruption Risk</span>
                <span className="text-[#1A1A2E]">{profile?.riskScore || weather.risk}%</span>
              </div>
              <Progress value={profile?.riskScore || weather.risk} className="h-2 bg-[#f0f2f9]" />
              <div className="mt-4 pt-4 border-t border-[#f0f2f9] space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[#64748B]">AI Trust/Risk Score</span>
                  <span className="text-[#1A1A2E]">{profile?.riskScore || 35}/100</span>
                </div>
                <div className="h-2 w-full bg-[#f0f2f9] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${profile?.riskScore || 35}%` }} transition={{ duration: 1 }} className="h-full" style={{ backgroundColor: (profile?.riskScore || 35) <= 30 ? "#22C55E" : (profile?.riskScore || 35) <= 60 ? "#F59E0B" : "#EF4444" }} />
                </div>
              </div>
            </div>
          </Card>

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

        <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm overflow-hidden">
          <div className="px-6 pt-5"><h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#1A1A2E]">Policy Status</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E8E6FF]">
            {[
              { label: "Activation Date", value: "Mar 18, 2026", icon: Calendar },
              { label: "Next Renewal", value: "25 Mar", icon: RefreshCcw },
              { label: "Renewal Amount", value: `₹${profile?.premium || 0}`, icon: IndianRupee },
              { label: "Commitment", value: "Week 1/4", icon: Info },
            ].map((stat, i) => (
              <div key={i} className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 bg-[#F1F0FF] rounded-xl flex items-center justify-center text-[#6C47FF] shrink-0"><stat.icon className="h-4.5 w-4.5" /></div>
                <div><p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">{stat.label}</p><p className="text-sm font-bold text-[#1A1A2E]">{stat.value}</p></div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 1 — INCOME DNA PROFILE */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Income DNA Profile</h2>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Updated {format(new Date(), "HH:mm")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-none border-b-4 border-[#F59E0B] rounded-[20px] shadow-sm p-5 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌅</span>
                <p className="text-[10px] font-black text-[#64748B] uppercase">Morning</p>
              </div>
              <div>
                <p className="text-[10px] text-[#64748B]">6-10 AM</p>
                <p className="text-xl font-bold text-[#1A1A2E]">₹{morningRate}/hr</p>
              </div>
              <p className="text-[10px] font-bold text-[#6C47FF]">0.75x multiplier</p>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F59E0B]" />
            </Card>

            <Card className="bg-white border-none border-b-4 border-[#EAB308] rounded-[20px] shadow-sm p-5 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">☀️</span>
                <p className="text-[10px] font-black text-[#64748B] uppercase">Afternoon</p>
              </div>
              <div>
                <p className="text-[10px] text-[#64748B]">12-4 PM</p>
                <p className="text-xl font-bold text-[#1A1A2E]">₹{afternoonRate}/hr</p>
              </div>
              <p className="text-[10px] font-bold text-[#6C47FF]">0.95x multiplier</p>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#EAB308]" />
            </Card>

            <Card className="bg-white border-none border-b-4 border-[#6C47FF] rounded-[20px] shadow-sm p-5 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌆</span>
                <p className="text-[10px] font-black text-[#64748B] uppercase">Evening</p>
              </div>
              <div>
                <p className="text-[10px] text-[#64748B]">5-9 PM</p>
                <p className="text-xl font-bold text-[#1A1A2E]">₹{eveningRate}/hr</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#6C47FF]">1.30x multiplier</p>
                <Badge className="bg-[#6C47FF] text-white text-[8px] font-black uppercase px-1.5 py-0.5 border-none">Peak</Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#6C47FF]" />
            </Card>

            <Card className="bg-white border-none border-b-4 border-[#3B82F6] rounded-[20px] shadow-sm p-5 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌙</span>
                <p className="text-[10px] font-black text-[#64748B] uppercase">Night</p>
              </div>
              <div>
                <p className="text-[10px] text-[#64748B]">9 PM-12 AM</p>
                <p className="text-xl font-bold text-[#1A1A2E]">₹{nightRate}/hr</p>
              </div>
              <p className="text-[10px] font-bold text-[#6C47FF]">0.85x multiplier</p>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3B82F6]" />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-6">
            <Card className="bg-white border-none rounded-[24px] shadow-sm p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Expected Weekly Earnings</p>
                <h3 className="text-6xl font-black text-[#6C47FF]">₹{profile?.dna?.weeklyIncome || 3360}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">Derived from your Income DNA earning pattern across projected working hours.</p>
              </div>
              <div className="mt-8 pt-6 border-t border-[#E8E6FF] space-y-4">
                <div>
                  <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-tighter mb-1">Recommended Plan</p>
                  <p className="text-lg font-bold text-[#F59E0B]">Pro Shield</p>
                </div>
                <Button variant="outline" className="w-full border-2 border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#6C47FF] hover:text-white rounded-xl h-11 transition-all">Upgrade Plan</Button>
              </div>
            </Card>

            <Card className="bg-white border-none rounded-[24px] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A1A2E] mb-8">Peak Earning Hours (24-Hour Profile)</h3>
              <div className="h-[220px] w-full">
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
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
                    />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="evening" stroke="#6C47FF" strokeWidth={2} fillOpacity={1} fill="url(#colorEvening)" />
                    <Area type="monotone" dataKey="lunch" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorLunch)" />
                    <Area type="monotone" dataKey="active" stroke="#94A3B8" strokeWidth={1} fill="none" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#6C47FF]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Evening peak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Lunch peak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-3 border-t border-dashed border-[#94A3B8]" />
                  <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Active hours</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 2 — EARNINGS PROTECTION SUMMARY */}
        <section>
          <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm overflow-hidden p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-xl font-bold text-[#1A1A2E]">Earnings Protection Summary</h2>
              <Badge className="bg-[#6C47FF] text-white rounded-full px-4 py-1.5 font-bold border-none text-xs">
                DNA Rate: ₹{activeRate}/hr ({activeSlotName})
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Potential Income Loss</p>
                <p className="text-3xl font-black text-[#EF4444]">₹{activeRate * 3}</p>
                <p className="text-[10px] text-[#64748B]">Calculated for 3 hour weather disruption</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Insurance Coverage</p>
                <p className="text-3xl font-black text-[#22C55E]">₹{profile?.coverage || 240}</p>
                <p className="text-[10px] text-[#64748B]">Max payout limit for your {profile?.plan_id || 'Pro'} plan</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Remaining Risk</p>
                <p className="text-3xl font-black text-[#EF4444]">₹{Math.max(0, (activeRate * 3) - (profile?.coverage || 240))}</p>
                <p className="text-[10px] text-[#64748B]">Net income gap after parametric payout</p>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <Button onClick={() => setChatOpen(true)} className="fixed bottom-8 right-8 h-14 w-14 bg-[#6C47FF] rounded-full shadow-2xl flex items-center justify-center text-white z-50 hover:scale-110 transition-all active:scale-95"><Brain className="h-7 w-7" /></Button>
      <AIAssistant open={chatOpen} onOpenChange={setChatOpen} />
      <AnimatePresence>{notif && <ClaimNotification claim={notif} onDismiss={() => setNotif(null)} onView={() => router.push('/claims')} />}</AnimatePresence>
    </div>
  );
}
