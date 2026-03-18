"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Phone, Briefcase, MapPin, Navigation, Loader2, AlertCircle, IndianRupee, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useFirestore, useAuth } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORMS = ["Swiggy", "Zomato", "Uber Eats", "Ola", "Dunzo", "Blinkit", "Other"];
const STATES_CITIES = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur"]
};

const PLANS = [
  {
    id: "basic",
    name: "Basic Shield",
    description: "Basic cover for heavy rain and minor floods.",
    price: 10,
    maxPayout: 60,
    features: ["Up to ₹60 payout per event", "Covers Heavy Rain & Floods", "Covers Severe AQI (Pollution)"]
  },
  {
    id: "pro",
    name: "Pro Shield",
    description: "Extensive cover for all extreme weather disruptions.",
    price: 25,
    maxPayout: 240,
    features: ["Up to ₹240 payout per event", "Covers Heavy Rain & Floods", "Covers Severe AQI (Pollution)"],
    recommended: true
  },
  {
    id: "elite",
    name: "Elite Shield",
    description: "Premium parametric cover with fastest payouts.",
    price: 50,
    maxPayout: 600,
    features: ["Up to ₹600 payout per event", "Covers Heavy Rain & Floods", "Covers Severe AQI (Pollution)"]
  }
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    platform: "",
    state: "",
    city: ""
  });
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [hourlyEarnings, setHourlyEarnings] = useState("60");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();

  const handleNext = () => {
    const cleanPhone = formData.phone.replace(/\s/g, '').replace('+91', '').trim();
    if (!formData.name || cleanPhone.length !== 10 || !formData.platform || !formData.state || !formData.city) {
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

      // Save user profile
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create Income DNA
      const base = Number(hourlyEarnings);
      await setDoc(doc(db, "income_dna", uid), {
        userId: uid,
        base_rate: base,
        morning_rate: Math.round(base * 0.75),
        afternoon_rate: Math.round(base * 0.95),
        evening_rate: Math.round(base * 1.30),
        night_rate: Math.round(base * 0.85),
        weekly_earnings: Math.round(base * 8 * 7),
        recommended_plan: PLANS.find(p => p.id === selectedPlan)?.name || 'Pro Shield',
        best_days: {
          mon: Math.round(base * 6.8),
          tue: Math.round(base * 7.2),
          wed: Math.round(base * 7.6),
          thu: Math.round(base * 8.4),
          fri: Math.round(base * 9.6),
          sat: Math.round(base * 10.4),
          sun: Math.round(base * 10.8)
        },
        updated_at: serverTimestamp()
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Account already exists. Please login.');
      } else {
        setErrorMessage(error.message || 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEEEFF] flex flex-col items-center py-10 px-4 font-body">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-[#6C47FF] rounded-2xl flex items-center justify-center shadow-btn">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">
            <span className={`${step >= 1 ? 'text-[#6C47FF]' : ''} flex items-center gap-2`}>① Basic Info</span>
            <span className={`${step >= 2 ? 'text-[#6C47FF]' : ''} flex items-center gap-2`}>② Choose Plan</span>
            <span className="flex items-center gap-2">③ Done</span>
          </div>
          <Progress value={step === 1 ? 33 : 66} className="h-2 w-full bg-white border border-[#E8E6FF]" />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-lg mx-auto w-full"
            >
              <Card className="border-[#E8E6FF] shadow-card rounded-[24px] overflow-hidden bg-white">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline font-bold text-[#1A1A2E]">Tell us about yourself</CardTitle>
                  <CardDescription className="text-[#64748B]">This helps us customize your Income DNA profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[#1A1A2E] font-semibold">
                      <User className="h-4 w-4 text-[#6C47FF]" /> Full Name
                    </Label>
                    <Input 
                      placeholder="Ravi Kumar" 
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12 rounded-xl border-[#E8E6FF] focus:border-[#6C47FF] bg-[#F8F9FF]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[#1A1A2E] font-semibold">
                      <Phone className="h-4 w-4 text-[#6C47FF]" /> Phone Number
                    </Label>
                    <Input 
                      placeholder="9342460938" 
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-12 rounded-xl border-[#E8E6FF] focus:border-[#6C47FF] bg-[#F8F9FF]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[#1A1A2E] font-semibold">
                      <Briefcase className="h-4 w-4 text-[#6C47FF]" /> Delivery Platform
                    </Label>
                    <Select onValueChange={val => setFormData(prev => ({ ...prev, platform: val }))}>
                      <SelectTrigger className="h-12 rounded-xl border-[#E8E6FF] bg-[#F8F9FF]">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-[#1A1A2E] font-semibold">
                        <MapPin className="h-4 w-4 text-[#6C47FF]" /> State
                      </Label>
                      <Select onValueChange={val => setFormData(prev => ({ ...prev, state: val, city: "" }))}>
                        <SelectTrigger className="h-12 rounded-xl border-[#E8E6FF] bg-[#F8F9FF]">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(STATES_CITIES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-[#1A1A2E] font-semibold">
                        <Navigation className="h-4 w-4 text-[#6C47FF]" /> City
                      </Label>
                      <Select onValueChange={val => setFormData(prev => ({ ...prev, city: val }))} disabled={!formData.state}>
                        <SelectTrigger className="h-12 rounded-xl border-[#E8E6FF] bg-[#F8F9FF]">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.state && (STATES_CITIES as any)[formData.state].map((c: string) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg p-3 text-[#DC2626] text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full h-12 font-bold bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl text-white" onClick={handleNext}>
                    Next → Choose Your Plan
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-headline font-bold text-[#1A1A2E]">Select Your Protection</h1>
                <p className="text-[#64748B]">Parametric coverage that pays out instantly during weather disruptions</p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {PLANS.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`relative cursor-pointer transition-all duration-300 border-2 rounded-[20px] bg-white ${
                      selectedPlan === plan.id ? "border-[#6C47FF] shadow-lg scale-105" : "border-[#E8E6FF] hover:border-[#6C47FF]/50"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6C47FF] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full z-10">
                        Recommended
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg font-headline font-bold text-[#1A1A2E]">{plan.name}</CardTitle>
                      <CardDescription className="text-[11px] text-[#64748B] h-8">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center py-4 bg-[#EDE9FF] rounded-xl">
                        <span className="text-2xl font-bold text-[#6C47FF]">₹{plan.price}</span>
                        <span className="text-[#64748B] text-xs font-medium">/week</span>
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-[#1A1A2E] font-medium leading-tight">
                            <Check className="h-3 w-3 text-[#22C55E] shrink-0 mt-0.5" /> {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="max-w-md mx-auto border-[#E8E6FF] shadow-card bg-white rounded-[24px] overflow-hidden">
                <CardContent className="pt-8 space-y-6">
                  <div className="space-y-3 text-center">
                    <Label className="text-lg font-bold text-[#1A1A2E] block">Avg. Hourly Earnings (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6C47FF]" />
                      <Input 
                        type="number" 
                        value={hourlyEarnings}
                        onChange={e => setHourlyEarnings(e.target.value)}
                        className="h-14 pl-12 text-2xl font-bold rounded-xl text-center border-[#E8E6FF] focus:border-[#6C47FF]"
                        placeholder="60"
                      />
                    </div>
                    <p className="text-[11px] text-[#94A3B8] italic">
                      Used to calculate parametric payouts based on your DNA hourly rate.
                    </p>
                  </div>

                  <div className="bg-[#EDE9FF]/50 p-4 rounded-xl border border-[#6C47FF]/20 flex gap-3">
                    <Zap className="h-5 w-5 text-[#6C47FF] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#6C47FF] font-medium leading-relaxed">
                      This plan auto-renews weekly for minimum 4 weeks. ₹{PLANS.find(p => p.id === selectedPlan)?.price}/week will be automatically deducted.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg p-3 text-[#DC2626] text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
                    </div>
                  )}

                  <Button 
                    className="w-full h-14 text-lg font-bold bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl text-white" 
                    onClick={handleRegister}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <><Zap className="mr-2 h-5 w-5 fill-current" /> Get Protected →</>}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}