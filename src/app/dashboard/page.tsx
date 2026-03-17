
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { doc, collection, query, limit, where, addDoc, serverTimestamp } from "firebase/firestore";
import { Shield, Zap, AlertCircle, ChevronRight, Map as MapIcon, Brain, Home, FileText, LogOut, Loader2, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { useMemo, useState } from "react";
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

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const simulateWeather = async () => {
    if (!user) return;
    
    if (!profile || !dna) {
      toast({
        variant: "destructive",
        title: "Simulation Blocked",
        description: "Please complete your profile and activate a protection plan first."
      });
      return;
    }

    setIsSimulating(true);
    try {
      const claimIdNum = Math.floor(10000 + Math.random() * 90000);
      const claimNumber = `#${String(claimIdNum).padStart(5, '0')}`;
      
      const baseRate = profile.avg_hourly_earnings || 60;
      const multiplier = 1.3; // Evening Peak simulation
      const dnaRate = baseRate * multiplier;
      const hoursLost = 4;
      const incomeLoss = dnaRate * hoursLost;
      
      let planCap = 120;
      if (profile.plan_id === 'max') planCap = 500;
      else if (profile.plan_id === 'pro') planCap = 240;
      else if (profile.plan_id === 'basic') planCap = 100;
      
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

  const currentDnaRate = dna?.evening_rate || 78;
  const baseRate = profile?.avg_hourly_earnings || 60;

  return (
    <div className="min-h-screen bg-bg-page flex flex-col font-body">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-heading">
            Gig<span className="text-primary">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
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
          <Button onClick={handleLogout} variant="ghost" className="text-body font-bold gap-2">
            <LogOut className="h-5 w-5" /> Switch
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 pb-20 p-6 lg:px-10">
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
            className="bg-primary hover:bg-primary-hover text-white font-bold shadow-btn rounded-btn h-11 px-6"
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
              <div className="text-2xl font-bold">{profile?.plan_id ? profile.plan_id.toUpperCase() + " SHIELD" : "Pro Shield"}</div>
              <p className="text-xs text-white/70">Parametric weather cover activated</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/10 p-2 rounded-lg">
                  <p className="text-[10px] uppercase opacity-60">Max Payout</p>
                  <p className="text-sm font-bold">₹{profile?.plan_id === 'max' ? 25 : profile?.plan_id === 'pro' ? 12 : 5}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                  <p className="text-[10px] uppercase opacity-60">Weekly Premium</p>
                  <p className="text-sm font-bold">₹{profile?.plan_id === 'max' ? 2 : 1}</p>
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
              <CardTitle className="text-sm font-bold text-warning uppercase tracking-wider">Weather Risk</CardTitle>
              <AlertCircle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-heading">AQI 142</div>
                <Badge className="bg-warning-bg text-warning border-transparent">Caution</Badge>
              </div>
              <Button className="w-full bg-warning hover:bg-warning/90 text-white font-bold h-10 mt-2 rounded-btn">
                View Precautions
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Active Plan", value: profile?.plan_id ? profile.plan_id.toUpperCase() + " SHIELD" : "Pro Shield" },
            { label: "Activation Date", value: profile?.plan_activated_at?.seconds ? format(new Date(profile.plan_activated_at.seconds * 1000), "MMM dd, yyyy") : "Recently" },
            { label: "Coverage Period", value: "Current Week" },
            { label: "Next Renewal", value: "Automatic", highlight: true }
          ].map((stat, i) => (
            <Card key={i} className="bg-white border-border shadow-sm p-4 rounded-xl">
              <p className="text-[11px] text-muted uppercase tracking-wider font-bold mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.highlight ? "text-primary" : "text-heading"}`}>{stat.value}</p>
              {stat.highlight && <p className="text-[10px] text-body mt-0.5">Auto-renews weekly</p>}
            </Card>
          ))}
        </section>

        <Card className="bg-[#EDE9FF] border-[#D4CCFF] shadow-card rounded-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl font-headline font-bold text-heading">Earnings Protection Summary</CardTitle>
              <Badge className="bg-primary text-white border-none py-1.5 px-4 rounded-full font-bold">
                DNA Rate Used: ₹{currentDnaRate}/hr (Evening Peak)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3 pt-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Potential Income Loss</p>
              <p className="text-2xl font-bold text-danger">₹{Math.round(currentDnaRate * 6)}</p>
              <p className="text-[10px] text-body">6 hrs × ₹{currentDnaRate}/hr</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Insurance Coverage</p>
              <p className="text-2xl font-bold text-success">₹{profile?.plan_id === 'max' ? 25 : profile?.plan_id === 'pro' ? 12 : 5}</p>
              <p className="text-[10px] text-body">Capped by {profile?.plan_id || 'Pro'} Shield limit</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Remaining Risk</p>
              <p className="text-2xl font-bold text-danger">₹{Math.max(0, Math.round(currentDnaRate * 6) - (profile?.plan_id === 'max' ? 25 : profile?.plan_id === 'pro' ? 12 : 5))}</p>
              <p className="text-[10px] text-body">Consider upgrading plan</p>
            </div>
          </CardContent>
        </Card>

        {/* Updated Income DNA Profile Section */}
        <section className="space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-headline font-bold text-heading">Income DNA Profile</h2>
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-body">Your personalized earning pattern — used to calculate accurate payouts</p>
            </div>
            <p className="text-xs text-muted font-mono uppercase tracking-widest">Updated Today</p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-border shadow-card rounded-card p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Expected Weekly Earnings</p>
                <div className="text-5xl font-bold text-primary">₹{dna?.weekly_earnings || 3120}</div>
                <p className="text-xs text-body mt-2">Derived from your Income DNA earning pattern</p>
              </div>
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase mb-1">Recommended Plan</p>
                  <p className="text-lg font-bold text-warning">{dna?.recommended_plan || "Max Shield"}</p>
                </div>
                <Button variant="outline" className="border-primary text-primary font-bold hover:bg-primary-light rounded-btn">
                  Upgrade Plan
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Morning", time: "6-10 AM", rate: dna?.morning_rate || 45, mult: "0.75", icon: "🌅", color: "bg-warning" },
                { label: "Afternoon", time: "12-4 PM", rate: dna?.afternoon_rate || 57, mult: "0.95", icon: "☀", color: "bg-orange-500" },
                { label: "Evening", time: "5-9 PM", rate: dna?.evening_rate || 78, mult: "1.30", icon: "🌆", color: "bg-primary" },
                { label: "Night", time: "9 PM-12 AM", rate: dna?.night_rate || 51, mult: "0.85", icon: "🌙", color: "bg-blue-500" }
              ].map((slot, i) => (
                <Card key={i} className="bg-white border-border shadow-sm p-4 rounded-xl flex flex-col justify-between overflow-hidden relative">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{slot.icon}</span>
                      <p className="text-[11px] font-bold text-muted uppercase">{slot.label}</p>
                    </div>
                    <p className="text-[10px] text-body mb-2">{slot.time}</p>
                    <p className="text-2xl font-bold text-heading">₹{slot.rate}/hr</p>
                    <p className="text-[10px] font-bold text-primary">{slot.mult}x multiplier</p>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-full ${slot.color} opacity-80`} />
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Peak Earning Hours */}
            <Card className="bg-white border-border shadow-card rounded-card p-6">
              <CardTitle className="text-lg font-bold mb-8">Peak Earning Hours (24-Hour Profile)</CardTitle>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLunch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EDE9FF" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#EDE9FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6FF" />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94A3B8' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="evening" name="Evening peak" stroke="#6C47FF" strokeWidth={3} fillOpacity={1} fill="url(#colorEvening)" />
                    <Area type="monotone" dataKey="lunch" name="Lunch peak" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorLunch)" />
                    <Area type="monotone" dataKey="active" name="Active hours" stroke="#D4CCFF" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                    <Legend 
                      verticalAlign="bottom" 
                      align="left" 
                      iconType="square" 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Best Working Days */}
            <Card className="bg-white border-border shadow-card rounded-card p-6">
              <CardTitle className="text-lg font-bold mb-8">Best Working Days (Daily Earnings)</CardTitle>
              <div className="space-y-5">
                {weeklyEarningsData.map((data, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 text-xs font-bold text-heading">{data.day}</span>
                    <div className="flex-1 h-2 bg-primary-light rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.percentage}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(108,71,255,0.4)]"
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-bold text-heading">₹{data.earning}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-headline font-bold text-heading">Delivery Risk Map — {profile?.city || 'Mumbai'}</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { zone: "South Mumbai", risk: "HIGH", bg: "bg-[#FFF0F0] border-[#FECACA]", text: "text-[#DC2626]" },
              { zone: "Andheri", risk: "MEDIUM", bg: "bg-[#FFFBEA] border-[#FDE68A]", text: "text-[#D97706]" },
              { zone: "Bandra", risk: "MEDIUM", bg: "bg-[#FFFBEA] border-[#FDE68A]", text: "text-[#D97706]" },
              { zone: "Dadar", risk: "LOW", bg: "bg-[#F0FDF4] border-[#BBF7D0]", text: "text-[#16A34A]" }
            ].map((zone, i) => (
              <Card key={i} className={`${zone.bg} p-4 rounded-xl border flex justify-between items-center`}>
                <span className="font-bold text-heading">{zone.zone}</span>
                <Badge className={`${zone.bg} ${zone.text} border-none font-bold text-[10px]`}>{zone.risk}</Badge>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Link href="/support">
        <Button className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-btn bg-primary hover:bg-primary-hover flex items-center gap-3 z-50">
          <Brain className="h-6 w-6 text-white" />
          <span className="font-bold">AI Support</span>
        </Button>
      </Link>
    </div>
  );
}
