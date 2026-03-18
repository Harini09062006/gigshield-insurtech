"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { doc, collection, query, limit, where, addDoc, serverTimestamp } from "firebase/firestore";
import { Shield, Zap, AlertCircle, Map as MapIcon, Brain, Home, FileText, LogOut, Loader2, Info, Calendar, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { format, addDays, differenceInDays } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const dnaRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "income_dna", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "claims"), where("worker_id", "==", user.uid), limit(5));
  }, [db, user]);

  const { data: rawClaims } = useCollection(claimsQuery);

  const claims = useMemo(() => {
    if (!rawClaims) return null;
    return [...rawClaims].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  }, [rawClaims]);

  // Renewal Logic Calculations
  const policyInfo = useMemo(() => {
    if (!profile?.plan_activated_at?.seconds) return null;
    const start = new Date(profile.plan_activated_at.seconds * 1000);
    const today = new Date();
    const diffDays = differenceInDays(today, start);
    const currentWeek = Math.floor(diffDays / 7) + 1;
    const nextRenewal = addDays(start, currentWeek * 7);
    const isRenewingTomorrow = (diffDays % 7 === 6);
    const commitmentEnd = addDays(start, 28);
    const isCommitmentActive = currentWeek <= 4;

    const premiums: Record<string, number> = { basic: 10, pro: 25, elite: 50 };
    const premiumAmount = premiums[profile.plan_id] || 25;

    return {
      startDate: start,
      currentWeek,
      nextRenewalDate: nextRenewal,
      premiumAmount,
      isRenewingTomorrow,
      isCommitmentActive,
      commitmentEndDate: commitmentEnd
    };
  }, [profile]);

  const handleLogout = async () => {
    await auth.signOut();
    router.replace("/");
  };

  const simulateWeather = async () => {
    if (!user) return;
    
    setIsSimulating(true);
    try {
      const claimIdNum = Math.floor(10000 + Math.random() * 90000);
      const claimNumber = `#${String(claimIdNum).padStart(5, '0')}`;
      
      const baseRate = profile?.avg_hourly_earnings || 60;
      const multiplier = 1.3; 
      const dnaRate = baseRate * multiplier;
      const hoursLost = 4;
      const incomeLoss = dnaRate * hoursLost;
      
      let planCap = 60;
      if (profile?.plan_id === 'elite') planCap = 600;
      else if (profile?.plan_id === 'pro') planCap = 240;
      else planCap = 60;
      
      const compensation = Math.min(incomeLoss, planCap);

      await addDoc(collection(db, "claims"), {
        worker_id: user.uid,
        claim_number: claimNumber,
        trigger_type: "weather",
        trigger_description: "Severe Rainfall (65mm) Detected",
        dna_time_slot: "Evening 5-9 PM",
        registered_rate: baseRate,
        time_multiplier: multiplier,
        dna_hourly_rate: dnaRate,
        hours_lost: hoursLost,
        income_loss: incomeLoss,
        compensation: compensation,
        plan_max_payout: planCap,
        status: "paid",
        fraud_check: { 
          gps: "verified", 
          weather: "confirmed", 
          duplicate: "passed" 
        },
        created_at: serverTimestamp()
      });

      toast({
        title: "Simulation Successful",
        description: "Severe weather detected. Your parametric claim was processed and paid instantly!"
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Simulation Failed", 
        description: error.message || "An unexpected error occurred during simulation." 
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const hourlyChartData = useMemo(() => [
    { hour: '12 AM', evening: 0, lunch: 0, active: 40 },
    { hour: '6 AM', evening: 0, lunch: 0, active: 45 },
    { hour: '12 PM', evening: 0, lunch: 80, active: 50 },
    { hour: '6 PM', evening: 95, lunch: 0, active: 60 },
    { hour: '11 PM', evening: 40, lunch: 0, active: 45 },
  ], []);

  const weeklyEarningsData = useMemo(() => [
    { day: 'Mon', earning: 408, percentage: 65 },
    { day: 'Tue', earning: 432, percentage: 68 },
    { day: 'Wed', earning: 456, percentage: 72 },
    { day: 'Thu', earning: 504, percentage: 78 },
    { day: 'Fri', earning: 576, percentage: 85 },
    { day: 'Sat', earning: 624, percentage: 95 },
    { day: 'Sun', earning: 648, percentage: 100 },
  ], []);

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-bg-page"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-page flex flex-col font-body">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-heading">
            Gig<span className="text-primary">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className={pathname === "/dashboard" ? "text-primary bg-primary-light" : "text-body"}>
              <Home className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/claims">
            <Button variant="ghost" size="icon" className={pathname === "/claims" ? "text-primary bg-primary-light" : "text-body"}>
              <FileText className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/heatmap">
            <Button variant="ghost" size="icon" className={pathname === "/heatmap" ? "text-primary bg-primary-light" : "text-body"}>
              <MapIcon className="h-6 w-6" />
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost" className="text-body font-bold gap-2">
            <LogOut className="h-5 w-5" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 pb-20 p-6 lg:px-10 max-w-7xl mx-auto w-full">
        {policyInfo?.isRenewingTomorrow && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning-bg border border-warning/30 p-4 rounded-xl flex items-start gap-4 shadow-sm"
          >
            <AlertCircle className="h-6 w-6 text-warning shrink-0" />
            <div>
              <p className="font-bold text-heading text-sm">Your plan renews tomorrow</p>
              <p className="text-xs text-body mt-0.5">₹{policyInfo.premiumAmount} will be auto-deducted. Coverage continues for the next 7 days.</p>
            </div>
          </motion.div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-heading">Welcome back, {profile?.name?.split(' ')[0] || 'Worker'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <p className="text-sm text-body font-medium">Active on {profile?.platform || 'Delivery'} in {profile?.city || 'Mumbai'}</p>
            </div>
          </div>
          <Button 
            onClick={simulateWeather} 
            disabled={isSimulating}
            className="bg-primary hover:bg-primary-hover text-white font-bold shadow-btn rounded-btn h-11 px-6 transition-all active:scale-95"
          >
            {isSimulating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
            Simulate Severe Weather
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary text-white border-none shadow-btn rounded-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-90">Active Protection</CardTitle>
              <Shield className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">{(profile?.plan_id === 'elite' ? 'ELITE' : profile?.plan_id === 'pro' ? 'PRO' : 'BASIC') + " SHIELD"}</div>
              <p className="text-xs text-white/70">Parametric weather cover activated</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/10 p-2 rounded-lg text-center">
                  <p className="text-[10px] uppercase opacity-60">Max Payout</p>
                  <p className="text-sm font-bold">₹{profile?.plan_id === 'elite' ? 600 : profile?.plan_id === 'pro' ? 240 : 60}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-lg text-center">
                  <p className="text-[10px] uppercase opacity-60">Weekly Premium</p>
                  <p className="text-sm font-bold">₹{profile?.plan_id === 'elite' ? 50 : profile?.plan_id === 'pro' ? 25 : 10}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-border shadow-card rounded-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted uppercase tracking-wider">AI Risk Prediction</CardTitle>
              <Brain className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-heading">12mm</div>
                <Badge className="bg-info-bg text-info border-transparent">Light Rain</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-body">
                  <span>Disruption Risk</span>
                  <span className="text-warning">35%</span>
                </div>
                <Progress value={35} className="h-2 bg-muted/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card-yellow border-[#FEF3C7] shadow-card rounded-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-warning uppercase tracking-wider">Commitment Status</CardTitle>
              <RefreshCcw className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-xl font-bold text-heading">
                  {policyInfo ? `Week ${policyInfo.currentWeek} of 4` : 'No active plan'}
                </div>
                <Badge className="bg-success-bg text-success border-transparent">Auto-Renew ON</Badge>
              </div>
              <p className="text-[10px] text-body">
                {policyInfo?.isCommitmentActive 
                  ? `Cancellation available from: ${format(policyInfo.commitmentEndDate, "MMM dd, yyyy")}`
                  : "Minimum commitment completed. Cancellation available."}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-headline font-bold text-heading">Policy Management</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Activation Date", value: policyInfo ? format(policyInfo.startDate, "MMM dd, yyyy") : "-", icon: Calendar },
              { label: "Next Renewal", value: policyInfo ? format(policyInfo.nextRenewalDate, "MMM dd, yyyy") : "-", icon: RefreshCcw },
              { label: "Renewal Amount", value: policyInfo ? `₹${policyInfo.premiumAmount}` : "-", icon: IndianRupee },
              { label: "Weeks Remaining", value: policyInfo ? Math.max(0, 4 - policyInfo.currentWeek) : "-", icon: Info }
            ].map((stat, i) => (
              <Card key={i} className="bg-white border-border shadow-sm p-4 rounded-xl flex items-center gap-4">
                <div className="h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase font-bold">{stat.label}</p>
                  <p className="text-base font-bold text-heading">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-headline font-bold text-heading">Income DNA Profile</h2>
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[11px] text-body">Your personalized earning pattern — used to calculate accurate payouts</p>
            </div>
            <p className="text-[11px] text-muted font-mono uppercase tracking-widest">Updated Today</p>
          </header>

          <div className="grid gap-3 md:grid-cols-2">
            <Card className="bg-white border-border shadow-card rounded-[12px] p-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Expected Weekly Earnings</p>
                <div className="text-3xl font-bold text-primary">₹{dna?.weekly_earnings || 3120}</div>
                <p className="text-[10px] text-body mt-1">Derived from your Income DNA earning pattern</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-muted uppercase">Recommended Plan</p>
                  <p className="text-base font-bold text-warning">{dna?.recommended_plan || "Pro Shield"}</p>
                </div>
                <Button variant="outline" size="sm" className="border-primary text-primary font-bold h-8 text-xs hover:bg-primary-light rounded-btn" asChild>
                  <Link href="/plans">Upgrade Plan</Link>
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Morning", time: "6-10 AM", rate: dna?.morning_rate || 45, mult: "0.75", icon: "🌅", color: "bg-warning" },
                { label: "Afternoon", time: "12-4 PM", rate: dna?.afternoon_rate || 57, mult: "0.95", icon: "☀", color: "bg-orange-500" },
                { label: "Evening", time: "5-9 PM", rate: dna?.evening_rate || 78, mult: "1.30", icon: "🌆", color: "bg-primary" },
                { label: "Night", time: "9 PM-12 AM", rate: dna?.night_rate || 51, mult: "0.85", icon: "🌙", color: "bg-blue-500" }
              ].map((slot, i) => (
                <Card key={i} className="bg-white border-border shadow-sm p-2.5 px-3 rounded-[10px] flex flex-col justify-between overflow-hidden relative">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[14px]">{slot.icon}</span>
                      <p className="text-[10px] font-bold text-muted uppercase">{slot.label}</p>
                    </div>
                    <p className="text-[10px] text-body mb-1">{slot.time}</p>
                    <p className="text-[16px] font-bold text-heading leading-none">₹{slot.rate}/hr</p>
                    <p className="text-[10px] font-bold text-primary mt-1">{slot.mult}x multiplier</p>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1 w-full ${slot.color} opacity-80 rounded-full`} />
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="bg-white border-border shadow-card rounded-[12px] p-4 max-w-full">
              <CardTitle className="text-[14px] font-semibold mb-2">Peak Earning Hours (24-Hour Profile)</CardTitle>
              <div className="h-[180px] w-full">
                {isMounted && (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={hourlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorEvening" x1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLunch" x1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorActive" x1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C4B8F8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#C4B8F8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6FF" opacity={0.3} />
                      <XAxis 
                        dataKey="hour" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        ticks={["12 AM", "6 AM", "12 PM", "6 PM", "11 PM"]}
                      />
                      <YAxis hide={true} />
                      <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="evening" name="Evening peak" stroke="#6C47FF" strokeWidth={2} fillOpacity={1} fill="url(#colorEvening)" />
                      <Area type="monotone" dataKey="lunch" name="Lunch peak" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorLunch)" />
                      <Area type="monotone" dataKey="active" name="Active hours" stroke="#C4B8F8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorActive)" />
                      <Legend 
                        verticalAlign="bottom" 
                        align="left" 
                        iconSize={8}
                        wrapperStyle={{ paddingTop: '4px', fontSize: '11px' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="bg-white border-border shadow-card rounded-[12px] p-4">
              <CardTitle className="text-[14px] font-semibold mb-2.5">Best Working Days (Daily Earnings)</CardTitle>
              <div className="space-y-1.5">
                {weeklyEarningsData.map((data, i) => (
                  <div key={i} className="flex items-center gap-2 h-[28px]">
                    <span className="w-7 text-[12px] font-medium text-body">{data.day}</span>
                    <div className="flex-1 h-[6px] bg-[#E8E6FF] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.percentage}%` }}
                        transition={{ duration: 1, delay: i * 0.05 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <span className="w-10 text-right text-[12px] font-bold text-heading">₹{data.earning}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Link href="/support">
        <Button className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-btn bg-primary hover:bg-primary-hover flex items-center gap-3 z-50 transition-all active:scale-95">
          <Brain className="h-6 w-6 text-white" />
          <span className="font-bold">AI Support</span>
        </Button>
      </Link>
    </div>
  );
}