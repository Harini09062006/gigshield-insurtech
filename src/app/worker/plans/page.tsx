"use client";

import { useState } from "react";
import { INSURANCE_PLANS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, Info, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function PlansPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const userPlanRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "user_plans", user.uid);
  }, [db, user]);

  const { data: activePlan } = useDoc(userPlanRef);

  const handleSelectPlan = async (plan: typeof INSURANCE_PLANS[0]) => {
    if (!user || !db) return;
    setLoadingPlanId(plan.id);
    try {
      await setDoc(doc(db, "user_plans", user.uid), {
        userId: user.uid,
        planId: plan.id,
        planName: plan.name,
        weekly_premium: plan.costPerWeek,
        maxPayout: plan.maxPayout,
        startedAt: serverTimestamp(),
        is_active: true
      });
      toast({ title: "Plan Activated", description: `You are now protected by ${plan.name}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: error.message });
    } finally {
      setLoadingPlanId(null);
    }
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-8 pb-20 bg-bg-page min-h-screen p-6 lg:p-10">
      <header>
        <h1 className="text-3xl font-headline font-bold text-heading">Protection Plans</h1>
        <p className="text-body">Tailored insurance coverage powered by your Income DNA</p>
      </header>

      <div className="p-6 bg-primary-light border border-primary/20 rounded-card flex flex-col md:flex-row items-center gap-6 shadow-card">
        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
          <Info className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-heading">How payouts are calculated?</h3>
          <p className="text-sm text-body">Your claim payout = AI-calculated hourly rate × hours in disrupted slot. Payouts are instant upon collective disruption detection.</p>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {INSURANCE_PLANS.map((plan) => (
          <motion.div key={plan.id} variants={item}>
            <Card className={`h-full flex flex-col relative transition-all duration-300 rounded-card shadow-card group ${
              activePlan?.planId === plan.id 
                ? "bg-primary text-white border-primary" 
                : "bg-white border-border hover:border-primary"
            }`}>
              {activePlan?.planId === plan.id && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-primary">
                  Current Plan
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <div className={`mx-auto h-16 w-16 rounded-2xl mb-4 flex items-center justify-center ${
                   activePlan?.planId === plan.id ? "bg-white/20 text-white" : "bg-primary-light text-primary"
                }`}>
                  <Shield className="h-8 w-8" />
                </div>
                <CardTitle className={`text-2xl font-headline font-bold ${activePlan?.planId === plan.id ? "text-white" : "text-heading"}`}>{plan.name}</CardTitle>
                <CardDescription className={`min-h-[40px] mt-2 ${activePlan?.planId === plan.id ? "text-white/80" : "text-body"}`}>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="text-center">
                  <span className={`text-4xl font-bold ${activePlan?.planId === plan.id ? "text-white" : "text-heading"}`}>₹{plan.costPerWeek}</span>
                  <span className={`text-sm font-medium ${activePlan?.planId === plan.id ? "text-white/80" : "text-muted"}`}> / week</span>
                </div>
                <div className="space-y-3">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${activePlan?.planId === plan.id ? "text-white" : "text-success"}`} />
                      <span>Max Payout: <span className="font-bold">₹{plan.maxPayout}</span></span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${activePlan?.planId === plan.id ? "text-white" : "text-success"}`} />
                      <span>Instant AI Verification</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full h-12 font-bold rounded-btn transition-all ${
                    activePlan?.planId === plan.id 
                      ? "bg-white/20 text-white hover:bg-white/30 border-white/20" 
                      : "bg-primary text-white hover:bg-primary-hover shadow-btn"
                  }`}
                  variant={plan.id === activePlan?.planId ? "outline" : "default"}
                  disabled={plan.id === activePlan?.planId || loadingPlanId !== null}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {loadingPlanId === plan.id ? <Loader2 className="animate-spin h-4 w-4" /> : activePlan?.planId === plan.id ? "Active Policy" : `Select ${plan.name}`}
                  {plan.id !== activePlan?.planId && loadingPlanId !== plan.id && <Zap className="ml-2 h-4 w-4 fill-current" />}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}