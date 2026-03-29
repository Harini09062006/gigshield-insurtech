"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Phone, Briefcase, MapPin, Navigation, Loader2, AlertCircle, IndianRupee, Zap, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useAuth } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getUserLocation } from "@/services/locationService";
import { CITIES_LIST } from "@/services/weatherService";

const PLATFORMS = ["Swiggy", "Zomato", "Uber Eats", "Ola", "Dunzo", "Blinkit", "Other"];
const STATES_CITIES = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "West Bengal": ["Kolkata", "Howrah"]
};

const PLANS = [
  { id: "basic", name: "Basic Shield", description: "Essential weather cover.", price: 10, maxPayout: 60, features: ["₹60 Payout", "Rain & Floods", "AQI Pollution"] },
  { id: "pro", name: "Pro Shield", description: "Most popular choice.", price: 25, maxPayout: 240, features: ["₹240 Payout", "Rain & Floods", "AQI Pollution"], recommended: true },
  { id: "elite", name: "Elite Shield", description: "Fastest payout limits.", price: 50, maxPayout: 600, features: ["₹600 Payout", "Rain & Floods", "AQI Pollution"] }
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", phone: "", platform: "", state: "", city: "" });
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [hourlyEarnings, setHourlyEarnings] = useState("60");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();

  // Try to capture location on page load
  useEffect(() => {
    async function initLoc() {
      try {
        const loc = await getUserLocation();
        setLocation(loc);
      } catch (e) {
        console.warn("Initial GPS capture skipped.");
      }
    }
    initLoc();
  }, []);

  const handleNext = async () => {
    const cleanPhone = formData.phone.replace(/\s/g, '').replace('+91', '').trim();
    if (!formData.name || cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit phone number.");
      return;
    }
    setErrorMessage("");
    setStep(2);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const cleanPhone = formData.phone.replace(/\s/g, '').replace('+91', '').trim();
      const email = cleanPhone + '@gigshield.app';
      const password = cleanPhone.slice(-6) + 'GIG#' + cleanPhone.slice(0, 4);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Fallback location if user denied GPS
      let finalLat = location?.lat || 0;
      let finalLng = location?.lng || 0;

      if (!finalLat && formData.city) {
        const cityData = CITIES_LIST.find(c => c.name.toLowerCase() === formData.city.toLowerCase());
        finalLat = cityData?.lat || 0;
        finalLng = cityData?.lng || 0;
      }

      await setDoc(doc(db, "users", uid), {
        name: formData.name,
        phone: cleanPhone,
        email: email,
        platform: formData.platform,
        state: formData.state,
        city: formData.city,
        id: uid,
        role: "worker",
        plan_id: selectedPlan,
        avg_hourly_earnings: Number(hourlyEarnings),
        lat: finalLat,
        lng: finalLng,
        plan_activated_at: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      const rate = Number(hourlyEarnings);
      await setDoc(doc(db, "income_dna", uid), {
        userId: uid,
        worker_id: uid,
        base_rate: rate,
        morning_rate: Math.round(rate * 0.75),
        afternoon_rate: Math.round(rate * 0.95),
        evening_rate: Math.round(rate * 1.30),
        night_rate: Math.round(rate * 0.85),
        weekly_earnings: rate * 40,
        updated_at: serverTimestamp()
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEEEFF] flex flex-col items-center py-10 px-4 font-body">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* NEW PROGRESS BAR SIBLING */}
        <div className="w-full max-w-md mx-auto mb-12">
          <div className="flex items-center justify-between mb-3 px-1">
            {['Basic Info', 'Choose Plan', 'Done'].map((label, i) => (
              <span 
                key={label} 
                className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                  i <= 1 ? 'text-[#6C47FF]' : 'text-[#94A3B8] opacity-40'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1.5 w-full bg-[#E8E6FF] rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-[#6C47FF] w-2/3 transition-all duration-1000 ease-in-out" 
              style={{ boxShadow: '0 0 10px rgba(108, 71, 255, 0.3)' }}
            />
          </div>
        </div>

        <div className="w-full flex justify-start">
          <Link href="/" className="flex items-center gap-2 text-[#6C47FF] hover:text-[#5535E8] font-bold text-sm group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Home
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-[#6C47FF] rounded-2xl flex items-center justify-center shadow-btn"><Shield className="h-7 w-7 text-white" /></div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">
            <span className={step >= 1 ? "text-[#6C47FF]" : ""}>① Profile</span>
            <div className="h-px w-8 bg-[#E8E6FF]" />
            <span className={step >= 2 ? "text-[#6C47FF]" : ""}>② Plan</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg mx-auto w-full">
              <Card className="border-[#E8E6FF] shadow-card rounded-[24px] bg-white p-6 space-y-5">
                <CardHeader className="p-0 mb-4 text-center">
                  <CardTitle className="text-2xl font-headline font-bold text-[#1A1A2E]">Worker Registration</CardTitle>
                  <CardDescription>Security is locked to your GPS location for fraud-free payouts.</CardDescription>
                </CardHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#64748B] uppercase">Full Name</Label>
                    <Input placeholder="Ravi Kumar" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-12 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#64748B] uppercase">Phone Number</Label>
                    <Input placeholder="9342460938" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="h-12 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#64748B] uppercase">Delivery Platform</Label>
                    <Select onValueChange={v => setFormData(p => ({ ...p, platform: v }))}>
                      <SelectTrigger className="h-12 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]"><SelectValue placeholder="Select platform" /></SelectTrigger>
                      <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select onValueChange={v => setFormData(p => ({ ...p, state: v, city: "" }))}>
                      <SelectTrigger className="h-12 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>{Object.keys(STATES_CITIES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={v => setFormData(p => ({ ...p, city: v }))} disabled={!formData.state}>
                      <SelectTrigger className="h-12 rounded-xl bg-[#F8F9FF] border-[#E8E6FF]"><SelectValue placeholder="City" /></SelectTrigger>
                      <SelectContent>{formData.state && (STATES_CITIES as any)[formData.state].map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {location && (
                  <div className="bg-[#DCFCE7] border border-[#BBF7D0] p-3 rounded-xl flex items-center gap-3">
                    <Check className="h-4 w-4 text-[#22C55E]" />
                    <p className="text-[10px] font-bold text-[#16A34A] uppercase">GPS Coordinates Locked: {location.lat.toFixed(2)}, {location.lng.toFixed(2)}</p>
                  </div>
                )}
                <Button className="w-full h-14 font-bold bg-[#6C47FF] hover:bg-[#5535E8] rounded-xl text-white mt-4 shadow-btn" onClick={handleNext}>Next → Choose Plan</Button>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                {PLANS.map(p => (
                  <Card key={p.id} className={`relative cursor-pointer transition-all border-2 rounded-[24px] bg-white p-6 ${selectedPlan === p.id ? "border-[#6C47FF] shadow-lg scale-105" : "border-[#E8E6FF]"}`} onClick={() => setSelectedPlan(p.id)}>
                    {p.recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6C47FF] text-white text-[10px] font-bold px-3 py-1 rounded-full z-10">Recommended</div>}
                    <h4 className="text-xl font-bold text-[#1A1A2E]">{p.name}</h4>
                    <div className="text-center py-4 bg-[#EDE9FF] rounded-2xl my-4 font-bold text-[#6C47FF]">₹{p.price}/week</div>
                    <ul className="space-y-2">{p.features.map((f, i) => <li key={i} className="flex gap-2 text-[11px] font-medium"><Check className="h-3.5 w-3.5 text-[#22C55E]" /> {f}</li>)}</ul>
                  </Card>
                ))}
              </div>
              <Card className="max-w-md mx-auto bg-white rounded-[24px] p-8 space-y-6 shadow-card border-none">
                <div className="text-center space-y-3">
                  <Label className="text-lg font-bold text-[#1A1A2E]">Avg. Hourly Earnings (₹)</Label>
                  <Input type="number" value={hourlyEarnings} onChange={e => setHourlyEarnings(e.target.value)} className="h-16 text-3xl font-bold text-center rounded-xl bg-[#F8F9FF] border-[#E8E6FF]" />
                </div>
                <Button className="w-full h-16 text-lg font-bold bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl text-white" onClick={handleRegister} disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2" /> : "Verify & Get Protected"}</Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
