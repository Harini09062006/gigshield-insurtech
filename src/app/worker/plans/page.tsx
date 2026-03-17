"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Check, Zap, Loader2, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "basic",
    name: "Basic Shield",
    description: "Basic cover for heavy rain and minor floods.",
    price: 1,
    maxPayout: 5,
    features: ["Up to ₹5 payout per event", "Covers Heavy Rain & Floods", "Covers Severe AQI (Pollution)"]
  },
  {
    id: "pro",
    name: "Pro Shield",
    description: "Extensive cover for all extreme weather disruptions.",
    price: 1,
    maxPayout: 12,
    features: ["Up to ₹12 payout per event", "Covers Heavy Rain & Floods", "Covers Severe AQI (Pollution)"],
    recommended: true
  },
  {
    id: "max",
    name: "Max Shield",
    description: "Premium parametric cover with fastest payouts.",
    price: 2,
    maxPayout: 25,
    features: ["Up to ₹25 payout per event", "Covers Heavy Rain & Floods", "Covers Severe AQI (Pollution)"]
  }
];

export default function PlansPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>("pro");
  const [hourlyEarnings, setHourlyEarnings] = useState("60");
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!user || !selectedPlan) return;
    setLoading(true);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      
      // Update main user profile
      await updateDoc(doc(db, "users", user.uid), {
        plan_id: selectedPlan,
        avg_hourly_earnings: Number(hourlyEarnings),
        plan_activated_at: serverTimestamp(),
      });

      // Save plan details separately for easy retrieval
      await setDoc(doc(db, "user_plans", user.uid), {
        userId: user.uid,
        planId: selectedPlan,
        planName: plan?.name,
        weekly_premium: plan?.price,
        maxPayout: plan?.maxPayout,
        startedAt: serverTimestamp(),
        is_active: true
      });

      // Generate initial Income DNA based on input
      const rate = Number(hourlyEarnings);
      await setDoc(doc(db, "income_dna", user.uid), {
        base_rate: rate,
        morning_rate: Math.round(rate * 0.75),
        afternoon_rate: Math.round(rate * 0.95),
        evening_rate: Math.round(rate * 1.30),
        night_rate: Math.round(rate * 0.85),
        weekly_earnings: rate * 40,
        recommended_plan: "Pro Shield",
        best_days: [rate * 6, rate * 6, rate * 6, rate * 7, rate * 8, rate * 10, rate * 10],
        updated_at: serverTimestamp()
      });

      toast({ title: "Protection Activated", description: "You are now covered by GigShield." });
      router.push("/worker/overview");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl space-y-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-btn">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest">
            <span className="text-primary flex items-center gap-2">① <span className="hidden sm:inline">Basic Info</span></span>
            <span className="text-primary flex items-center gap-2">② <span className="hidden sm:inline">Choose Plan</span></span>
            <span className="text-muted flex items-center gap-2">③ <span className="hidden sm:inline">Done</span></span>
          </div>
          <Progress value={66} className="h-2 w-full bg-white border border-border" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-headline font-bold">Choose Your Protection</h1>
          <p className="text-body">Parametric coverage that pays out instantly during weather disruptions</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 border-2 rounded-card ${
                selectedPlan === plan.id ? "border-primary shadow-lg scale-105" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl font-headline font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-xs h-10">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4 bg-primary-light rounded-xl">
                  <span className="text-3xl font-bold text-primary">₹{plan.price}</span>
                  <span className="text-body font-medium">/week</span>
                  <p className="text-[10px] text-primary/70 uppercase font-bold mt-1">Dynamic Risk Premium</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-heading font-medium">
                      <Check className="h-4 w-4 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full font-bold h-11 ${selectedPlan === plan.id ? "bg-primary" : "variant-ghost border-primary text-primary"}`}
                >
                  {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="max-w-md mx-auto border-border shadow-card bg-white">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2 text-center">
              <Label className="text-lg font-bold">Avg. Hourly Earnings (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-5 w-5 text-primary" />
                <Input 
                  type="number" 
                  value={hourlyEarnings}
                  onChange={e => setHourlyEarnings(e.target.value)}
                  className="h-12 pl-10 text-xl font-bold rounded-btn text-center"
                  placeholder="60"
                />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Used to calculate parametric payouts based on hours lost during weather triggers.
              </p>
            </div>
            <Button 
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary-hover shadow-btn" 
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