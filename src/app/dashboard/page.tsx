"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { doc, collection, query, limit, where, addDoc, serverTimestamp } from "firebase/firestore";
import { Shield, Zap, AlertCircle, Map as MapIcon, Brain, Home, FileText, LogOut, Loader2, Info, Calendar, RefreshCcw, IndianRupee, Thermometer, ChevronRight } from "lucide-react";
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
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function WorkerDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const dnaRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "income_dna", user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);
  const { data: dna, isLoading: isDnaLoading } = useDoc(dnaRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "claims"), where("worker_id", "==", user.uid), limit(5));
  }, [db, user]);

  const { data: rawClaims } = useCollection(claimsQuery);

  const claims = useMemo(() => {
    if (!rawClaims) return null;
    return [...rawClaims].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  }, [rawClaims]);

  const policyInfo = useMemo(() => {
    if (!profile?.plan_activated_at?.seconds) return null;
    const start = new Date(profile.plan_activated_at.seconds * 1000);
    const today = new Date();
    const diffDays = differenceInDays(today, start);
    const currentWeek = Math.floor(diffDays / 7) + 1;
    const nextRenewal = addDays(start, currentWeek * 7);
    const isRenewingTomorrow = (diffDays % 7 === 6);
    
    const premiums: Record<string, number> = { basic: 10, pro: 25, elite: 50 };
    const maxPayouts: Record<string, number> = { basic: 60, pro: 240, elite: 600 };
    
    return {
      startDate: start,
      currentWeek,
      nextRenewalDate: nextRenewal,
      premiumAmount: premiums[profile.plan_id] || 25,
      maxPayout: maxPayouts[profile.plan_id] || 240,
      isRenewingTomorrow
    };
  }, [profile]);

  const handleLogout = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  const simulateWeather = async () => {
    if (!user || !profile) return;
    setIsSimulating(true);
    try {
      const baseRate = profile.avg_hourly_earnings || 60;
      const multiplier = 1.3;
      const dnaRate = Math.round(baseRate * multiplier);
      const hoursLost = 4;
      const incomeLoss = dnaRate * hoursLost;
      const maxPayout = policyInfo?.maxPayout || 240;
      const compensation = Math.min(incomeLoss, maxPayout);

      await addDoc(collection(db, "claims"), {
        worker_id: user.uid,
        claim_number: `#${Math.floor(10000 + Math.random() * 90000)}`,
        trigger_type: "weather",
        trigger_description: "Severe Rainfall (65mm) Detected",
        dna_time_slot: "Evening 5-9 PM",
        registered_rate: baseRate,
        time_multiplier: multiplier,
        dna_hourly_rate: dnaRate,
        hours_lost: hoursLost,
        income_loss: incomeLoss,
        compensation: compensation,
        plan_max_payout: maxPayout,
        status: "paid",
        fraud_check: { gps: "verified", weather: "confirmed", duplicate: "passed" },
        created_at: serverTimestamp()
      });

      toast({ title: "Simulation Successful", description: "Severe weather detected. Instant payout processed!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Simulation Failed", description: e.message });
    } finally {
      setIsSimulating(false);
    }
  };

  if (isUserLoading || isProfileLoading || !mounted) {
    return (
      <div className="min-h-screen bg-[#EEEEFF] p-6 space-y-8">
        <div className="h-16 w-full bg-white rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-white rounded-2xl animate-pulse" />
          <div className="h-40 bg-white rounded-2xl animate-pulse" />
          <div className="h-40 bg-white rounded-2xl animate-pulse" />
        </div>
        <div className="h-60 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  const dnaRate = Math.round((profile?.avg_hourly_earnings ?? 60) * 1.3);
  const potentialLoss = dnaRate * 6;
  const coverage = policyInfo?.maxPayout ?? 240;
  const remainingRisk = Math.max(0, potentialLoss - coverage);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#EEEEFF] flex flex-col font-body"
    >
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[#6C47FF] bg-[#EDE9FF]"><Home className="h-6 w-6" /></Button>
          <Link href="/claims"><Button variant="ghost" size="icon" className="text-[#64748B]"><FileText className="h-6 w-6" /></Button></Link>
          <Link href="/heatmap"><Button variant="ghost" size="icon" className="text-[#64748B]"><MapIcon className="h-6 w-6" /></Button></Link>
          <Button onClick={handleLogout} variant="ghost" className="text-[#EF4444] font-bold"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-6 lg:px-10 max-w-7xl mx-auto w-full">
        {policyInfo?.isRenewingTomorrow && (
          <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 p-4 rounded-xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="h-6 w-6 text-[#F59E0B] shrink-0" />
            <div>
              <p className="font-bold text-[#1A1A2E] text-sm">Your plan renews tomorrow</p>
              <p className="text-xs text-[#64748B] mt-0.5">₹{policyInfo.premiumAmount} will be auto-deducted. Coverage continues for the next 7 days.</p>
            </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome, {profile?.name?.split(' ')[0] ?? 'Worker'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <p className="text-sm text-[#64748B] font-medium">Active on {profile?.platform ?? 'Delivery'} in {profile?.city ?? 'Mumbai'}</p>
            </div>
          </div>
          <Button 
            onClick={simulateWeather} 
            disabled={isSimulating}
            className="bg-[#6C47FF] hover:bg-[#5535E8] text-white font-bold shadow-btn rounded-xl h-11 px-6"
          >
            {isSimulating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
            Simulate Severe Weather
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-[#6C47FF] text-white border-none shadow-btn rounded-[20px] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-90">Active Protection</CardTitle>
              <Shield className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">{(profile?.plan_id?.toUpperCase() ?? 'PRO') + " SHIELD"}</div>
              <p className="text-[10px] text-white/70">Parametric weather cover activated</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/10 p-2 rounded-lg text-center">
                  <p className="text-[9px] uppercase opacity-60">Max Payout</p>
                  <p className="text-sm font-bold">₹{policyInfo?.maxPayout ?? 240}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-lg text-center">
                  <p className="text-[9px] uppercase opacity-60">Weekly Premium</p>
                  <p className="text-sm font-bold">₹{policyInfo?.premiumAmount ?? 25}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-[#E8E6FF] shadow-card rounded-[20px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">AI Risk Prediction</CardTitle>
              <Brain className="h-5 w-5 text-[#6C47FF]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-[#1A1A2E]">12mm</div>
                <Badge className="bg-[#DBEAFE] text-[#3B82F6] border-none font-bold">Light Rain</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-[#64748B]">
                  <span>Disruption Risk</span>
                  <span className="text-[#F59E0B]">35%</span>
                </div>
                <Progress value={35} className="h-1.5 bg-[#EEEEFF]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FFFBEA] border-[#FEF3C7] shadow-card rounded-[20px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">Commitment Status</CardTitle>
              <RefreshCcw className="h-5 w-5 text-[#F59E0B]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-xl font-bold text-[#1A1A2E]">
                  Week {policyInfo?.currentWeek ?? 1} of 4
                </div>
                <Badge className="bg-[#DCFCE7] text-[#22C55E] border-none font-bold">Renewal ON</Badge>
              </div>
              <p className="text-[10px] text-[#64748B] leading-tight italic">
                Minimum 4-week commitment active. Payouts calculated instantly via DNA model.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#1A1A2E]">Policy Management</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Activation Date", value: policyInfo ? format(policyInfo.startDate, "MMM dd, yyyy") : "-", icon: Calendar },
              { label: "Next Renewal", value: policyInfo ? format(policyInfo.nextRenewalDate, "dd MMM") : "-", icon: RefreshCcw },
              { label: "Renewal Amount", value: policyInfo ? `₹${policyInfo.premiumAmount}` : "-", icon: IndianRupee },
              { label: "Status", value: "Active", icon: Shield, color: "text-[#22C55E]" }
            ].map((stat, i) => (
              <Card key={i} className="bg-white border-[#E8E6FF] shadow-sm p-4 rounded-xl flex items-center gap-4">
                <div className="h-10 w-10 bg-[#EDE9FF] rounded-lg flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color ?? 'text-[#6C47FF]'}`} />
                </div>
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase font-bold">{stat.label}</p>
                  <p className="text-sm font-bold text-[#1A1A2E]">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Card className="bg-[#EDE9FF] border-[#D4CCFF] shadow-card rounded-[20px] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold text-[#1A1A2E]">Earnings Protection Summary</CardTitle>
              <Badge className="bg-[#6C47FF] text-white border-none py-1.5 px-4 rounded-full font-bold text-[10px]">
                DNA Rate: ₹{dnaRate}/hr (Evening Peak)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3 pt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Potential Income Loss</p>
              <p className="text-2xl font-bold text-[#EF4444]">₹{potentialLoss}</p>
              <p className="text-[9px] text-[#64748B]">6 hrs disruption during peak</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Insurance Coverage</p>
              <p className="text-2xl font-bold text-[#22C55E]">₹{coverage}</p>
              <p className="text-[9px] text-[#64748B]">Parametric Payout Limit</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Remaining Risk</p>
              <p className="text-2xl font-bold text-[#EF4444]">₹{remainingRisk}</p>
              <p className="text-[9px] text-[#64748B]">Consider upgrading plan</p>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1A1A2E]">Income DNA Profile</h2>
            <p className="text-[10px] text-[#94A3B8] font-mono uppercase tracking-widest">Updated {format(new Date(), "HH:mm")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Morning", time: "6-10 AM", rate: dna?.morning_rate ?? 45, mult: "0.75", icon: "🌅", color: "#F59E0B" },
              { label: "Afternoon", time: "12-4 PM", rate: dna?.afternoon_rate ?? 57, mult: "0.95", icon: "☀", color: "#F97316" },
              { label: "Evening", time: "5-9 PM", rate: dna?.evening_rate ?? 78, mult: "1.30", icon: "🌆", color: "#6C47FF" },
              { label: "Night", time: "9 PM-12 AM", rate: dna?.night_rate ?? 51, mult: "0.85", icon: "🌙", color: "#3B82F6" }
            ].map((slot, i) => (
              <Card key={i} className="bg-white border-[#E8E6FF] shadow-sm p-3 rounded-xl overflow-hidden relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{slot.icon}</span>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase">{slot.label}</p>
                </div>
                <p className="text-[10px] text-[#64748B] mb-1">{slot.time}</p>
                <p className="text-lg font-bold text-[#1A1A2E]">₹{slot.rate}/hr</p>
                <p className="text-[9px] font-bold text-[#6C47FF] mt-1">{slot.mult}x multiplier</p>
                <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: slot.color, opacity: 0.2 }} />
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-[#E8E6FF] shadow-card rounded-xl p-4">
              <CardTitle className="text-sm font-semibold mb-4">Peak Earning Hours (24-Hour Profile)</CardTitle>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { hour: '12 AM', evening: 0, lunch: 0, active: 40 },
                    { hour: '6 AM', evening: 0, lunch: 0, active: 45 },
                    { hour: '12 PM', evening: 0, lunch: 80, active: 50 },
                    { hour: '6 PM', evening: 95, lunch: 0, active: 60 },
                    { hour: '11 PM', evening: 40, lunch: 0, active: 45 },
                  ]}>
                    <defs>
                      <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3}/><stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6FF" opacity={0.3} />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="evening" name="Evening peak" stroke="#6C47FF" fillOpacity={1} fill="url(#colorE)" />
                    <Area type="monotone" dataKey="lunch" name="Lunch peak" stroke="#F59E0B" fillOpacity={0.1} fill="#F59E0B" />
                    <Area type="monotone" dataKey="active" name="Active hours" stroke="#C4B8F8" fillOpacity={0.1} fill="#C4B8F8" />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-white border-[#E8E6FF] shadow-card rounded-xl p-4">
              <CardTitle className="text-sm font-semibold mb-4">Best Working Days (Daily Earnings)</CardTitle>
              <div className="space-y-2">
                {[
                  { d: 'Mon', e: 408 }, { d: 'Tue', e: 432 }, { d: 'Wed', e: 456 },
                  { d: 'Thu', e: 504 }, { d: 'Fri', e: 576 }, { d: 'Sat', e: 624 }, { d: 'Sun', e: 648 }
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-2 h-7">
                    <span className="w-8 text-[11px] font-medium text-[#64748B]">{row.d}</span>
                    <div className="flex-1 h-1.5 bg-[#E8E6FF] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(row.e / 648) * 100}%` }}
                        className="h-full bg-[#6C47FF]"
                      />
                    </div>
                    <span className="w-10 text-right text-[11px] font-bold text-[#1A1A2E]">₹{row.e}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Link href="/support">
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-btn bg-[#6C47FF] hover:bg-[#5535E8] flex items-center justify-center z-50">
          <Brain className="h-7 w-7 text-white" />
        </Button>
      </Link>
    </motion.div>
  );
}