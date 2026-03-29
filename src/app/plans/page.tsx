"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Check, Zap, Loader2, IndianRupee, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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

export default function PlansPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>("pro");
  const [hourlyEarnings, setHourlyEarnings] = useState("60");
  const [loading, setLoading] = useState(false);

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

  const handleActivate = async () => {
    if (!user || !selectedPlan) return;
    setLoading(true);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      const avgEarnings = Number(hourlyEarnings);
      
      await updateDoc(doc(db, "users", user.uid), {
        plan_id: selectedPlan,
        avg_hourly_earnings: avgEarnings,
        plan_activated_at: serverTimestamp(),
        auto_renew: true,
        commitment_weeks: 4
      });

      const dna = calculateIncomeDNA(avgEarnings);

      await setDoc(doc(db, "income_dna", user.uid), {
        userId: user.uid,
        worker_id: user.uid,
        base_rate: avgEarnings,
        ...dna,
        recommended_plan: plan?.name || "Pro Shield",
        best_days: {
          mon: avgEarnings * 6.8,
          tue: avgEarnings * 7.2,
          wed: avgEarnings * 7.6,
          thu: avgEarnings * 8.4,
          fri: avgEarnings * 9.6,
          sat: avgEarnings * 10.4,
          sun: avgEarnings * 10.8
        },
        updated_at: serverTimestamp()
      });

      toast({ title: "Protection Activated", description: `You are now covered by ${plan?.name}.` });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return null;

  const currentPlan = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-bg-page flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-6xl space-y-10">
        
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-btn">
            <Shield className="h-7 w-7 text-white" />
          </div>

          {/* Refined Horizontal Step Progress Bar - Repositioned Below Shield */}
          <div className="w-full max-w-3xl mx-auto mt-4 mb-4 px-6">
            <div className="flex items-center justify-between mb-3 px-1">
              {['Basic Info', 'Choose Plan', 'Done'].map((step, i) => (
                <span 
                  key={i} 
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                    i <= 1 ? 'text-primary' : 'text-muted-foreground opacity-40'
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
            <div className="h-[3px] w-full bg-[#E8E6FF] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#6C47FF] to-[#3B82F6] w-2/3 transition-all duration-1000 ease-in-out" 
              />
            </div>
          </div>

          <StepIndicator currentStep={2} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-headline font-bold text-heading">Choose Your Protection</h1>
          <p className="text-body max-w-lg mx-auto">Parametric coverage that pays out instantly during weather disruptions</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 border-2 rounded-card bg-white ${
                selectedPlan === plan.id ? "border-primary shadow-lg" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full z-10">
                  Recommended
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl font-headline font-bold text-heading">{plan.name}</CardTitle>
                <CardDescription className="text-xs text-body h-10">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-5 bg-primary-light rounded-xl">
                  <span className="text-3xl font-bold text-primary">₹{plan.price}</span>
                  <span className="text-body font-medium">/week</span>
                  <p className="text-[10px] text-primary/70 uppercase font-bold mt-1">Dynamic Risk Premium</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-heading font-medium">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full font-bold h-11 rounded-btn ${selectedPlan === plan.id ? "bg-primary text-white" : "variant-ghost border border-primary text-primary bg-white hover:bg-primary-light"}`}
                >
                  {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="max-w-md mx-auto border-border shadow-card bg-white rounded-card overflow-hidden">
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-3 text-center">
              <Label className="text-lg font-bold text-heading block">Avg. Hourly Earnings (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input 
                  type="number" 
                  value={hourlyEarnings}
                  onChange={e => setHourlyEarnings(e.target.value)}
                  className="h-14 pl-12 text-2xl font-bold rounded-btn text-center border-input focus:border-primary"
                  placeholder="60"
                />
              </div>
              <p className="text-xs text-muted leading-relaxed italic px-4">
                Used to calculate parametric payouts based on hours lost during weather triggers.
              </p>
            </div>

            <div className="bg-primary-light/50 p-4 rounded-xl border border-primary/20 flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary font-medium leading-relaxed">
                This plan auto-renews weekly for minimum 4 weeks. ₹{currentPlan?.price || '0'}/week will be automatically deducted.
              </p>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary-hover shadow-btn rounded-btn" 
              onClick={handleActivate}
              disabled={loading || !selectedPlan}
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <><Zap className="mr-2 h-5 w-5 fill-current" /> Get Protected →</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
