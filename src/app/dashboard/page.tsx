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
  LineChart,
  Line,
  Legend,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, getDocs, query, where, limit, updateDoc, type Firestore } from "firebase/firestore";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { AIAssistant } from "@/components/chatbot/AIAssistant";
import { ClaimNotification } from "@/components/ClaimNotification";
import { useRouter } from "next/navigation";
import { getUserLocation, calculateDistance, gpsCheck } from "@/services/locationService";
import { runFraudChecks } from "@/services/fraudDetection";

// API Configuration
const WEATHER_API_KEY = "be5f61ff6b261dedfa89e321d466a063";

/**
 * Updates worker's Income DNA profile based on recent activity frequency.
 */
export const updateIncomeDNA = async (
  workerId: string,
  db: Firestore
) => {
  try {
    const snap = await getDocs(query(
      collection(db, "activity"),
      where("userId", "==", workerId),
      limit(100)
    ))
    const acts = snap.docs.map(d => d.data())
    
    const calc = (min: number, max: number) => {
      const slot = acts.filter(
        a => {
          const timestamp = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const hour = timestamp.getHours();
          return hour >= min && hour < max;
        }
      )
      return slot.length > 0
        ? Math.min(1.5, 
            Math.max(0.5, slot.length / 10))
        : 1.0
    }
    
    await updateDoc(
      doc(db, "income_dna", workerId), {
      multipliers: {
        morning: calc(6, 10),
        afternoon: calc(12, 16),
        evening: calc(17, 21),
        night: calc(21, 24)
      },
      lastUpdated: serverTimestamp()
    })
  } catch(e) {
    console.error("DNA update error:", e)
  }
}

const calculateRiskScore = (
  rainfall: number,
  city: string,
  hour: number
): number => {
  let score = 0;
  
  // Weather points (max 40)
  if (rainfall > 50) score += 40;
  else if (rainfall > 30) score += 30;
  else if (rainfall > 10) score += 20;
  else score += 5;
  
  // City risk (max 30)
  const HIGH = [
    'Chennai','Mumbai','Kolkata',
    'Kochi','Howrah'
  ];
  score += HIGH.includes(city) ? 30 : 15;
  
  // Time risk (max 30)
  if (hour >= 17 && hour <= 21) score += 30;
  else if (hour >= 12 && hour <= 16) score += 20;
  else score += 10;
  
  return Math.min(score, 100);
};

const weeklyData = [
  { week: "Week 1", earned: 6200, protected: 0 },
  { week: "Week 2", earned: 5800, protected: 240 },
  { week: "Week 3", earned: 6400, protected: 0 },
  { week: "Week 4", earned: 4200, protected: 480 }
]

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  // STATE
  const [chatOpen, setChatOpen] = useState(false);
  const [notif, setNotif] = useState<any>(null);
  const [weather, setWeather] = useState({
    rainMM: 12,
    condition: "Light Rain",
    risk: 35
  });

  const [calc, setCalc] = useState({
    potentialLoss: 468,
    coverage: 240,
    remaining: 228
  });

  // 🛡️ AUTH PROTECTION: Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() =>
    user ? doc(db, "users", user.uid) : null,
    [db, user?.uid]
  );
  const dnaRef = useMemoFirebase(() =>
    user ? doc(db, "income_dna", user.uid) : null,
    [db, user?.uid]
  );

  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  const riskScore = calculateRiskScore(
    weather.rainMM,
    profile?.city || "",
    new Date().getHours()
  );

  // Chart Data for Income DNA Profile
  const chartData = [
    { time: '6 AM', evening: 10, lunch: 5, active: 20 },
    { time: '8 AM', evening: 15, lunch: 10, active: 35 },
    { time: '10 AM', evening: 20, lunch: 25, active: 45 },
    { time: '12 PM', evening: 30, lunch: 75, active: 55 },
    { time: '2 PM', evening: 35, lunch: 60, active: 50 },
    { time: '4 PM', evening: 50, lunch: 30, active: 60 },
    { time: '6 PM', evening: 95, lunch: 15, active: 85 },
    { time: '8 PM', evening: 85, lunch: 10, active: 75 },
    { time: '10 PM', evening: 40, lunch: 5, active: 45 },
    { time: '11 PM', evening: 25, lunch: 0, active: 30 },
  ];

  // FETCH WEATHER
  const fetchWeather = async () => {
    try {
      const position = await getUserLocation().catch(() => null);

      const lat = position?.lat || 19.0760;
      const lon = position?.lng || 72.8777;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();

      const rain = data.rain?.['1h'] || 0;
      const risk = rain > 20 ? 85 : rain > 5 ? 45 : 15;

      setWeather({
        rainMM: Math.round(rain) || 12,
        condition: data.weather[0]?.main || "Light Rain",
        risk: risk || 35
      });

      calculateLoss(rain || 12);
    } catch (e) {
      console.error("Weather fetch error", e);
    }
  };

  const calculateLoss = (rainMM: number) => {
    const baseRate = profile?.avg_hourly_earnings || 60;
    const eveningRate = dna?.evening_rate || Math.round(baseRate * 1.3);
    const loss = Math.round((rainMM || 1) * 0.5 * eveningRate);
    setCalc({
      potentialLoss: loss || 468,
      coverage: 240,
      remaining: Math.max(0, (loss || 468) - 240)
    });
  };

  // 🌧️ SIMULATE WEATHER & WRITE TO CLAIM HISTORY WITH ENHANCED GPS VERIFICATION
  const simulateWeather = async () => {
    if (!user || !db) return;

    // 1. Capture real location at the time of claim (CLAIM LOCATION)
    const currentLoc = await getUserLocation().catch(() => null);
    
    // 2. Fetch Stored Worker Location (BASE LOCATION)
    const workerLoc = profile?.location 
      ? { lat: Number(profile.location.lat), lng: Number(profile.location.lng) }
      : (profile?.lat && profile?.lng ? { lat: Number(profile.lat), lng: Number(profile.lng) } : null);
    
    const rain = 50 + Math.random() * 50;
    const roundedRain = Math.round(rain);
    
    setWeather({
      rainMM: roundedRain,
      condition: "Heavy Rain",
      risk: 95
    });
    
    calculateLoss(rain);

    try {
      // 3. RUN FRAUD DETECTION ENGINE
      const workerForFraud = {
        id: user.uid,
        city: profile?.city || 'Mumbai',
        claimCity: profile?.city || 'Mumbai'
      };
      
      const fraudResult = await runFraudChecks(workerForFraud, db).catch(() => ({
        checks: {},
        trustScore: 0,
        decision: "BLOCKED",
        processingTime: "0ms"
      }));

      const baseRate = profile?.avg_hourly_earnings || 60;
      const eveningRate = dna?.evening_rate || Math.round(baseRate * 1.3);
      const compensation = 240; 

      // 4. Legacy Check Integration
      const validationStatus = gpsCheck(profile, currentLoc);
      const gps_status = validationStatus === 'PASSED' ? 'matched' : (validationStatus === 'FAILED' ? 'mismatch' : 'unknown');
      
      // Map fraud decision to legacy status for UI compatibility (paid/review)
      const claim_status = fraudResult.decision === 'APPROVED' ? 'paid' : 'review';

      console.log("[Simulation Result]", {
        gps: gps_status,
        trust: fraudResult.trustScore,
        outcome: fraudResult.decision
      });

      const docRef = await addDoc(collection(db, "claims"), {
        worker_id: user.uid,
        claim_number: "SIM-" + Math.floor(100000 + Math.random() * 900000),
        trigger_type: "Severe Rain Simulation",
        trigger_description: "Simulated " + roundedRain + "mm Rainfall Event",
        dna_time_slot: "Evening 5-9 PM",
        dna_hourly_rate: eveningRate,
        hours_lost: 4,
        compensation: compensation,
        
        status: claim_status,
        
        // NEW FRAUD DATA FIELDS
        fraudChecks: fraudResult.checks,
        trustScore: fraudResult.trustScore,
        decision: fraudResult.decision,
        processingTime: fraudResult.processingTime,

        lat: currentLoc?.lat || workerLoc?.lat || 19.0760,
        lng: currentLoc?.lng || workerLoc?.lng || 72.8777,
        gps_status: gps_status,
        createdAt: serverTimestamp(),
        created_at: serverTimestamp() 
      });

      // Show instant notification if approved
      if (fraudResult.decision === 'APPROVED') {
        const procSecs = (parseFloat(fraudResult.processingTime) / (fraudResult.processingTime.toLowerCase().includes('ms') || parseFloat(fraudResult.processingTime) > 100 ? 1000 : 1)).toFixed(1) + "s";
        setNotif({
          id: docRef.id.slice(0, 6),
          amount: compensation,
          trigger: "Simulated " + roundedRain + "mm Rainfall",
          timeSlot: "Evening 5-9 PM",
          processingTime: procSecs,
          workerName: profile?.name?.split(' ')[0] || "Worker"
        });
      }
    } catch (err) {
      console.error("Simulation claim write failed:", err);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    if (user) fetchWeather();
  }, [user, dna]);

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#EEEEFF] font-body text-[#1A1A2E] pb-12">
      
      <header className="bg-white px-6 py-3 flex items-center justify-between border-b border-[#E8E6FF] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-xl font-headline font-bold">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
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
          <Button 
            onClick={simulateWeather}
            className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold rounded-xl shadow-btn h-10 px-5 text-sm"
          >
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
                <p className="text-base font-black">₹{profile?.max_payout || 240}</p>
              </div>
              <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
                <p className="text-[8px] font-bold uppercase opacity-60 mb-0.5">Premium</p>
                <p className="text-base font-black">₹{profile?.premium || 25}</p>
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
                <span className="text-[#1A1A2E]">{weather.risk}%</span>
              </div>
              <Progress value={weather.risk} className="h-2 bg-[#f0f2f9]" />
              
              {/* NEW LIVE RISK SCORE SECTION */}
              <div className="mt-4 pt-4 border-t border-[#f0f2f9] space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[#64748B]">Live Risk Score</span>
                  <span className="text-[#1A1A2E]">{riskScore}/100</span>
                </div>
                <div className="h-2 w-full bg-[#f0f2f9] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${riskScore}%` }}
                    transition={{ duration: 1 }}
                    className="h-full"
                    style={{
                      backgroundColor: riskScore <= 30 ? "#22C55E" : riskScore <= 60 ? "#F59E0B" : "#EF4444"
                    }}
                  />
                </div>
                {riskScore > 90 && (
                  <motion.p
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-[9px] font-black text-[#EF4444] text-center mt-1"
                  >
                    ⚡ CLAIM MAY AUTO-FIRE!
                  </motion.p>
                )}
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
          <div className="px-6 pt-5">
            <h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#1A1A2E]">Policy Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E8E6FF]">
            {[
              { label: "Activation Date", value: "Mar 18, 2026", icon: Calendar },
              { label: "Next Renewal", value: "25 Mar", icon: RefreshCcw },
              { label: "Renewal Amount", value: "₹25", icon: IndianRupee },
              { label: "Commitment", value: "Week 1/4", icon: Info },
            ].map((stat, i) => (
              <div key={i} className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 bg-[#F1F0FF] rounded-xl flex items-center justify-center text-[#6C47FF] shrink-0">
                  <stat.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">{stat.label}</p>
                  <p className="text-sm font-bold text-[#1A1A2E]">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white rounded-[24px] border border-[#E8E6FF] p-6 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#1A1A2E]">Earnings Protection Summary</h3>
            <Badge className="bg-[#6C47FF] text-white hover:bg-[#6C47FF] border-none font-bold py-1 px-3 rounded-full text-[10px]">
              DNA Rate: ₹{dna?.evening_rate || 78}/hr (Evening Peak)
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#64748B]">Potential Income Loss</p>
              <p className="text-3xl font-black text-[#EF4444]">₹{calc.potentialLoss}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#64748B]">Insurance Coverage</p>
              <p className="text-3xl font-black text-[#22C55E]">₹{calc.coverage}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#64748B]">Remaining Risk</p>
              <p className="text-3xl font-black text-[#EF4444]">₹{calc.remaining}</p>
            </div>
          </div>
        </Card>

        <section className="space-y-4 pt-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Income DNA Profile</h2>
            <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Updated 17:25</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "MORNING", range: "6-10 AM", rate: 45, mult: "0.75x multiplier", color: "#F59E0B", icon: Sunrise },
              { title: "AFTERNOON", range: "12-4 PM", rate: 57, mult: "0.95x multiplier", color: "#EAB308", icon: Sun },
              { title: "EVENING", range: "5-9 PM", rate: 78, mult: "1.30x multiplier", color: "#6C47FF", icon: Sunset, peak: true },
              { title: "NIGHT", range: "9 PM-12 AM", rate: 51, mult: "0.85x multiplier", color: "#3B82F6", icon: Moon },
            ].map((slot, i) => (
              <Card key={i} className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm p-5 relative overflow-hidden flex flex-col gap-1.5 h-[130px]">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gray-50 rounded-lg">
                    <slot.icon size={12} className="text-gray-400" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">{slot.title}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 mb-0.5">{slot.range}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-[#1A1A2E]">₹{slot.rate}</span>
                    <span className="text-xs font-bold text-[#1A1A2E]">/hr</span>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-[#6C47FF]">{slot.mult} {slot.peak && "← PEAK"}</p>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: slot.color }} />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm p-6 h-[300px]">
              <h3 className="text-xs font-bold text-[#1A1A2E] mb-4">Peak Earning Hours (24-Hour Profile)</h3>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLunch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 8, fill: '#94A3B8', fontWeight: 600 }}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '9px' }} 
                    />
                    <Area type="monotone" dataKey="evening" stroke="#6C47FF" strokeWidth={2} fillOpacity={1} fill="url(#colorEvening)" />
                    <Area type="monotone" dataKey="lunch" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorLunch)" />
                    <Area type="monotone" dataKey="active" stroke="#E8E6FF" strokeWidth={1} fill="none" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-[#6C47FF]" /><span className="text-[8px] font-bold text-[#94A3B8] uppercase">EVENING PEAK</span></div>
                <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-[#F59E0B]" /><span className="text-[8px] font-bold text-[#94A3B8] uppercase">LUNCH PEAK</span></div>
                <div className="flex items-center gap-1.5"><div className="h-0.5 w-2 rounded-full border-t border-dashed border-[#94A3B8]" /><span className="text-[8px] font-bold text-[#94A3B8] uppercase">ACTIVE HOURS</span></div>
              </div>
            </Card>

            <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm p-6 flex flex-col justify-between h-[300px]">
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">EXPECTED WEEKLY EARNINGS</p>
                <div className="text-4xl font-bold text-[#6C47FF]">₹3360</div>
                <p className="text-[11px] text-gray-400 leading-relaxed mt-2">Derived from your Income DNA earning pattern across 40 projected working hours.</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">RECOMMENDED PLAN</p>
                  <p className="text-lg font-bold text-[#F59E0B]">Pro Shield</p>
                </div>
                <Button variant="outline" className="border-2 border-[#6C47FF] text-[#6C47FF] font-bold hover:bg-[#F1F0FF] rounded-xl px-4 h-9 transition-all text-xs">Upgrade Plan</Button>
              </div>
            </Card>

          </div>
        </section>

        {/* WEEKLY EARNINGS HISTORY GRAPH */}
        <section className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-[#1A1A2E]">📈 Weekly Earnings History</h2>
          <Card className="bg-white border border-[#E8E6FF] rounded-[24px] shadow-sm p-6 h-[350px]">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earned" 
                    stroke="#6C47FF" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#6C47FF", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                    name="Earnings (₹)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="protected" 
                    stroke="#22C55E" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#22C55E", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                    name="Protection Payouts (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

      </main>

      <Button 
        onClick={() => setChatOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 bg-[#6C47FF] rounded-full shadow-2xl flex items-center justify-center text-white z-50 hover:scale-110 transition-all active:scale-95"
      >
        <Brain className="h-7 w-7" />
      </Button>

      <AIAssistant open={chatOpen} onOpenChange={setChatOpen} />

      <AnimatePresence>
        {notif && (
          <ClaimNotification 
            claim={notif}
            onDismiss={() => setNotif(null)}
            onView={() => router.push('/claims')}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
