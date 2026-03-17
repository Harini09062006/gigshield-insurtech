"use client";

import { INSURANCE_PLANS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, Info, Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PlansPage() {
  const currentPlanId = 'pro'; // Mock active plan

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-bold">Protection Plans</h1>
        <p className="text-muted-foreground">Tailored insurance coverage powered by your Income DNA</p>
      </header>

      <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Info className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-bold">How payouts are calculated?</h3>
          <p className="text-sm text-muted-foreground">Your claim payout = AI-calculated hourly rate × hours in disrupted slot. Payouts are instant upon collective disruption detection.</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                Learn More <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="w-64 text-xs">Our Disruption Engine monitors thousands of signals to detect network outages, logistical strikes, or environmental factors affecting gig workers in real-time.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
      >
        {INSURANCE_PLANS.map((plan) => (
          <motion.div key={plan.id} variants={item}>
            <Card className={`h-full flex flex-col relative transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 ${
              plan.id === currentPlanId ? "border-primary ring-1 ring-primary/50 bg-primary/5" : "border-border/50 bg-card/50"
            }`}>
              {plan.id === currentPlanId && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border-4 border-background">
                  Current Plan
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <div className={`mx-auto h-16 w-16 rounded-2xl mb-4 flex items-center justify-center ${
                   plan.id === 'elite' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                }`}>
                  <Shield className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-headline font-bold">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px] mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">₹{plan.costPerWeek}</span>
                  <span className="text-muted-foreground text-sm font-medium"> / week</span>
                </div>
                
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key Benefits</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                      <span>Max Payout: <span className="font-bold">₹{plan.maxPayout}</span></span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                      <span>Instant AI Verification</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                      <span>Earnings Outage Coverage</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                      <span>24/7 Priority Support</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full h-12 font-bold ${
                    plan.id === currentPlanId ? "bg-muted text-muted-foreground cursor-not-allowed" : ""
                  }`}
                  variant={plan.id === 'elite' ? "default" : "outline"}
                  disabled={plan.id === currentPlanId}
                >
                  {plan.id === currentPlanId ? "Active Policy" : `Select ${plan.name}`}
                  {plan.id !== currentPlanId && <Zap className="ml-2 h-4 w-4 fill-current" />}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}