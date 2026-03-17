"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, limit, where } from "firebase/firestore";
import { Shield, Zap, TrendingUp, AlertCircle, ChevronRight, FileText, Map as MapIcon, Brain, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function WorkerOverview() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const dnaRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "income_dna", user.uid);
  }, [db, user]);

  const userPlanRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "user_plans", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(profileRef);
  const { data: dna, isLoading: isDnaLoading } = useDoc(dnaRef);
  const { data: activePlan, isLoading: isPlanLoading } = useDoc(userPlanRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "claims"), where("worker_id", "==", user.uid), limit(5));
  }, [db, user]);

  const { data: rawClaims, isLoading: isClaimsLoading } = useCollection(claimsQuery);

  const claims = useMemo(() => {
    if (!rawClaims) return null;
    return [...rawClaims].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  }, [rawClaims]);

  const hourlyChartData = useMemo(() => [
    { hour: '6am', earning: 40 }, { hour: '8am', earning: 45 }, { hour: '10am', earning: 55 },
    { hour: '12pm', earning: 50 }, { hour: '2pm', earning: 52 }, { hour: '4pm', earning: 60 },
    { hour: '6pm', earning: 85 }, { hour: '8pm', earning: 95 }, { hour: '10pm', earning: 65 },
    { hour: '12am', earning: 45 }
  ], []);

  const weeklyChartData = useMemo(() => [
    { day: 'Mon', earning: 600 }, { day: 'Tue', earning: 550 }, { day: 'Wed', earning: 580 },
    { day: 'Thu', earning: 620 }, { day: 'Fri', earning: 800 }, { day: 'Sat', earning: 1100 },
    { day: 'Sun', earning: 950 }
  ], []);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-8 pb-20 bg-bg-page min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 lg:px-10">
        <div>
          <h1 className="text-3xl font-headline font-bold text-heading">Welcome back, {profile?.name?.split(' ')[0] || 'Worker'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <p className="text-sm text-body font-medium">Active on {profile?.platform || 'Delivery'} in {profile?.city || 'Mumbai'}</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary-hover text-white font-bold shadow-btn rounded-btn h-11 px-6">
          🌧 Simulate Severe Weather <Zap className="ml-2 h-4 w-4 fill-current" />
        </Button>
      </header>

      <div className="px-6 lg:px-10 space-y-8">
        {/* Top 3 Cards Row */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-3">
          <motion.div variants={item}>
            <Card className="bg-primary text-white border-none shadow-btn rounded-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-90">Active Protection</CardTitle>
                <Shield className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">{activePlan?.planName || "Pro Shield"}</div>
                <p className="text-xs text-white/70">Parametric weather cover activated</p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <p className="text-[10px] uppercase opacity-60">Max Payout</p>
                    <p className="text-sm font-bold">₹{activePlan?.maxPayout || "12"}</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <p className="text-[10px] uppercase opacity-60">Weekly Premium</p>
                    <p className="text-sm font-bold">₹{activePlan?.weekly_premium || "1"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={item}>
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
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-[#FFFBEA] border-[#FEF3C7] shadow-card rounded-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-warning uppercase tracking-wider">Weather Risk</CardTitle>
                <AlertCircle className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-bold text-heading">AQI 142</div>
                  <Badge className="bg-warning-bg text-warning border-transparent">Caution</Badge>
                </div>
                <Button className="w-full bg-warning hover:bg-warning/90 text-white font-bold h-10 mt-2">
                  View Precautions
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Policy Status Mini Cards */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Active Plan", value: activePlan?.planName || "Pro Shield" },
            { label: "Activation Date", value: activePlan?.startedAt?.seconds ? format(new Date(activePlan.startedAt.seconds * 1000), "MMM dd, yyyy") : "Nov 12, 2024" },
            { label: "Coverage Period", value: "Nov 12 - Nov 19" },
            { label: "Next Renewal", value: "Nov 19, 2024", highlight: true }
          ].map((stat, i) => (
            <Card key={i} className="bg-white border-border shadow-sm p-4 rounded-xl">
              <p className="text-[11px] text-muted uppercase tracking-wider font-bold mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.highlight ? "text-primary" : "text-heading"}`}>{stat.value}</p>
              {stat.highlight && <p className="text-[10px] text-body mt-0.5">Auto-renews weekly</p>}
            </Card>
          ))}
        </section>

        {/* Earnings Protection Summary */}
        <Card className="bg-[#EDE9FF] border-[#D4CCFF] shadow-card rounded-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl font-headline font-bold text-heading">Earnings Protection Summary</CardTitle>
              <Badge className="bg-primary text-white border-none py-1.5 px-4 rounded-full font-bold">
                DNA Rate Used: ₹78/hr (Evening Peak · ₹60 × 1.3×)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3 pt-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Potential Income Loss</p>
              <p className="text-2xl font-bold text-danger">₹468</p>
              <p className="text-[10px] text-body">6 hrs × ₹78/hr (Evening DNA rate)</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Insurance Coverage</p>
              <p className="text-2xl font-bold text-success">₹240</p>
              <p className="text-[10px] text-body">Capped by Pro Shield limit</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Remaining Risk</p>
              <p className="text-2xl font-bold text-danger">₹228</p>
              <p className="text-[10px] text-body">Consider upgrading plan</p>
            </div>
            <div className="md:col-span-3 bg-warning-bg p-3 rounded-lg border border-warning/20 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm font-medium text-warning">Consider upgrading to Max Shield to cover your income completely during severe outages.</p>
            </div>
          </CardContent>
        </Card>

        {/* Claims & Payouts Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-headline font-bold text-heading">Claims & Payouts</h2>
              <Badge variant="outline" className="border-primary text-primary bg-primary-light font-bold">
                Worker Earnings Model: ₹60/hr
              </Badge>
            </div>
            <Link href="/worker/claims">
              <Button variant="ghost" className="text-primary font-bold hover:bg-primary-light">
                View Full History <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total Claims", value: "8", color: "text-heading" },
              { label: "Total Payout", value: "₹1,440", color: "text-success" },
              { label: "Total Hours Lost", value: "24", color: "text-heading" },
              { label: "Avg. Payout/Hr", value: "₹60", color: "text-primary" }
            ].map((stat, i) => (
              <Card key={i} className="bg-white border-border shadow-sm p-4 rounded-xl text-center">
                <p className="text-[11px] text-muted uppercase tracking-wider font-bold mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Income DNA Profile Section */}
        <section className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-headline font-bold text-heading">Income DNA Profile</h2>
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-body">Your personalized earning pattern — used to calculate accurate payouts</p>
            </div>
            <p className="text-xs text-muted font-mono uppercase tracking-widest">Updated Today, 08:32 AM</p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-border shadow-card rounded-card p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Expected Weekly Earnings</p>
                <div className="text-5xl font-bold text-primary">₹3,120</div>
                <p className="text-xs text-body mt-2">Derived from your Income DNA earning pattern</p>
              </div>
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase mb-1">Recommended Plan</p>
                  <p className="text-lg font-bold text-warning">Max Shield</p>
                </div>
                <Button variant="outline" className="border-primary text-primary font-bold hover:bg-primary-light">
                  Upgrade Plan
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Morning (6-10 AM)", rate: "45", mult: "0.75", val: 45, icon: "🌅" },
                { label: "Afternoon (12-4 PM)", rate: "57", mult: "0.95", val: 57, icon: "☀" },
                { label: "Evening (5-9 PM)", rate: "78", mult: "1.30", val: 78, icon: "🌆" },
                { label: "Night (9 PM-12 AM)", rate: "51", mult: "0.85", val: 51, icon: "🌙" }
              ].map((slot, i) => (
                <Card key={i} className="bg-white border-border shadow-sm p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{slot.icon}</span>
                    <Badge className="bg-primary/10 text-primary text-[10px] font-bold border-none">{slot.mult}×</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase truncate">{slot.label}</p>
                    <p className="text-xl font-bold text-heading">₹{slot.rate}/hr</p>
                  </div>
                  <Progress value={slot.val} className="h-1 mt-3" />
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-border shadow-card rounded-card p-6">
              <CardTitle className="text-lg font-bold mb-6">Peak Earning Hours (24-Hour Profile)</CardTitle>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyChartData}>
                    <defs>
                      <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6FF" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="earning" stroke="#6C47FF" strokeWidth={3} fillOpacity={1} fill="url(#colorEarning)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-body">
                <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-primary" /> Evening Peak</span>
                <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-primary/40" /> Lunch Peak</span>
              </div>
            </Card>

            <Card className="bg-white border-border shadow-card rounded-card p-6">
              <CardTitle className="text-lg font-bold mb-6">Best Working Days (Daily Earnings)</CardTitle>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1A1A2E', fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: '#F5F3FF' }} />
                    <Bar dataKey="earning" radius={[0, 4, 4, 0]}>
                      {weeklyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index > 4 ? '#F59E0B' : '#6C47FF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </section>

        {/* Delivery Risk Map */}
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
      </div>

      {/* Floating AI Support */}
      <Link href="/worker/support">
        <Button className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-btn bg-primary hover:bg-primary-hover flex items-center gap-3">
          <Brain className="h-6 w-6 text-white" />
          <span className="font-bold">AI Support</span>
        </Button>
      </Link>
    </div>
  );
}