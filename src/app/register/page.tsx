"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Phone, Briefcase, MapPin, Navigation, Loader2, AlertCircle, IndianRupee, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useAuth } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

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

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Choose Plan' },
    { num: 3, label: 'Done' }
  ]
  const progress = currentStep === 1 
    ? 33 : currentStep === 2 ? 66 : 100

  return (
    <div style={{marginBottom: '24px'}}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '28px', height: '28px',
                borderRadius: '50%',
                background: currentStep >= step.num
                  ? '#6C47FF' : '#E8E6FF',
                color: currentStep >= step.num
                  ? 'white' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {currentStep > step.num ? '✓' : step.num}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: currentStep === step.num
                  ? '600' : '400',
                color: currentStep === step.num
                  ? '#6C47FF' : '#94A3B8',
                whiteSpace: 'nowrap'
              }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: '2px', width: '40px',
                background: currentStep > step.num
                  ? '#6C47FF' : '#E8E6FF',
                marginBottom: '18px',
                borderRadius: '99px'
              }}/>
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{
        height: '4px',
        background: '#E8E6FF',
        borderRadius: '99px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '4px',
          width: `${progress}%`,
          background: '#6C47FF',
          borderRadius: '99px',
          transition: 'width 0.3s ease'
        }}/>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", phone: "", platform: "", state: "", city: "" });
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [hourlyEarnings, setHourlyEarnings] = useState("60");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();

  function calculateIncomeDNA(base: number) {
    const m_rate = Math.round(base * 0.75)
    const a_rate = Math.round(base * 0.95)
    const e_rate = Math.round(base * 1.30)
    const n_rate = Math.round(base * 0.85)

    const morning   = m_rate * 4
    const afternoon = a_rate * 4
    const evening   = e_rate * 4
    const night     = n_rate * 3
    const daily     = morning + afternoon + evening + night
    const weekly    = daily * 7
    
    return {
      morning_rate:   m_rate,
      afternoon_rate: a_rate,
      evening_rate:   e_rate,
      night_rate:     n_rate,
      morning_earnings: morning,
      afternoon_earnings: afternoon,
      evening_earnings: evening,
      night_earnings: night,
      daily_earnings: daily,
      weekly_earnings: weekly
    }
  }

  const handleNext = () => {
    const cleanPhone = formData.phone.replace(/\s/g, '').replace('+91', '').trim();
    if (!formData.name || cleanPhone.length !== 10) {
      setErrorMessage("Please fill all fields correctly.");
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
        plan_activated_at: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      const base = Number(hourlyEarnings);
      const dna = calculateIncomeDNA(base);
      
      await setDoc(doc(db, "income_dna", uid), {
        userId: uid,
        worker_id: uid,
        base_rate: base,
        ...dna,
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-[#6C47FF] rounded-2xl flex items-center justify-center shadow-btn"><Shield className="h-7 w-7 text-white" /></div>
          <StepIndicator currentStep={step} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-lg mx-auto w-full">
              <Card className="border-[#E8E6FF] shadow-card rounded-[24px] bg-white p-6 space-y-5">
                <CardHeader className="p-0 mb-4"><CardTitle className="text-2xl font-headline font-bold">Tell us about yourself</CardTitle></CardHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label className="flex items-center gap-2 font-semibold"><User className="h-4 w-4 text-[#6C47FF]" /> Full Name</Label><Input placeholder="Ravi Kumar" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-12 rounded-xl" /></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2 font-semibold"><Phone className="h-4 w-4 text-[#6C47FF]" /> Phone Number</Label><Input placeholder="9342460938" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="h-12 rounded-xl" /></div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><Briefcase className="h-4 w-4 text-[#6C47FF]" /> Platform</Label>
                    <Select onValueChange={v => setFormData(p => ({ ...p, platform: v }))}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select platform" /></SelectTrigger><SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="font-semibold">State</Label><Select onValueChange={v => setFormData(p => ({ ...p, state: v, city: "" }))}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="State" /></SelectTrigger><SelectContent>{Object.keys(STATES_CITIES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label className="font-semibold">City</Label><Select onValueChange={v => setFormData(p => ({ ...p, city: v }))} disabled={!formData.state}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="City" /></SelectTrigger><SelectContent>{formData.state && (STATES_CITIES as any)[formData.state].map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                </div>
                {errorMessage && <div className="bg-[#FEE2E2] text-[#DC2626] p-3 rounded-lg text-sm">{errorMessage}</div>}
                <Button className="w-full h-12 font-bold bg-[#6C47FF] hover:bg-[#5535E8] rounded-xl text-white mt-4" onClick={handleNext}>Next → Choose Plan</Button>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                {PLANS.map(p => (
                  <Card key={p.id} className={`relative cursor-pointer transition-all border-2 rounded-[20px] bg-white p-6 ${selectedPlan === p.id ? "border-[#6C47FF] shadow-lg scale-105" : "border-[#E8E6FF]"}`} onClick={() => setSelectedPlan(p.id)}>
                    {p.recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6C47FF] text-white text-[10px] font-bold px-3 py-1 rounded-full">Recommended</div>}
                    <h4 className="text-lg font-bold">{p.name}</h4>
                    <p className="text-xs text-[#64748B] mb-4">{p.description}</p>
                    <div className="text-center py-4 bg-[#EDE9FF] rounded-xl mb-4"><span className="text-2xl font-bold text-[#6C47FF]">₹{p.price}</span><span className="text-xs">/week</span></div>
                    <ul className="space-y-2">{p.features.map((f, i) => <li key={i} className="flex gap-2 text-[11px] font-medium"><Check className="h-3 w-3 text-[#22C55E]" /> {f}</li>)}</ul>
                  </Card>
                ))}
              </div>
              <Card className="max-w-md mx-auto bg-white rounded-[24px] p-8 space-y-6">
                <div className="text-center space-y-3"><Label className="text-lg font-bold">Avg. Hourly Earnings (₹)</Label><Input type="number" value={hourlyEarnings} onChange={e => setHourlyEarnings(e.target.value)} className="h-14 text-2xl font-bold text-center rounded-xl" /></div>
                <div className="bg-[#EDE9FF]/50 p-4 rounded-xl flex gap-3"><Zap className="h-5 w-5 text-[#6C47FF]" /><p className="text-xs text-[#6C47FF] font-medium">Auto-renews weekly for 4 weeks. ₹{PLANS.find(p => p.id === selectedPlan)?.price}/week will be deducted.</p></div>
                <Button className="w-full h-14 text-lg font-bold bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl text-white" onClick={handleRegister} disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2" /> : "Get Protected →"}</Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
