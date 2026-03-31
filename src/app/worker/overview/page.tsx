"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, limit, where, orderBy } from "firebase/firestore";
import { Shield, Zap, AlertCircle, ChevronRight, Map as MapIcon, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function WorkerOverview() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const dnaRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "income_dna", user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);
  const { data: dna } = useDoc(dnaRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "claims"), where("worker_id", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
  }, [db, user?.uid]);

  const { data: rawClaims } = useCollection(claimsQuery);

  const claims = useMemo(() => {
    if (!rawClaims) return null;
    return [...rawClaims].sort((a, b) => {
      const timeA = a.createdAt?.seconds || a.created_at?.seconds || 0;
      const timeB = b.createdAt?.seconds || b.created_at?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawClaims]);

  const hourlyChartData = [
    { hour: '6am', earning: 40 }, { hour: '8am', earning: 45 }, { hour: '10am', earning: 55 },
    { hour: '12pm', earning: 50 }, { hour: '2pm', earning: 52 }, { hour: '4pm', earning: 60 },
    { hour: '6pm', earning: 85 }, { hour: '8pm', earning: 95 }, { hour: '10pm', earning: 65 },
    { hour: '12am', earning: 45 }
  ];

  const weeklyChartData = [
    { day: 'Mon', earning: 600 }, { day: 'Tue', earning: 550 }, { day: 'Wed', earning: 580 },
    { day: 'Thu', earning: 620 }, { day: 'Fri', earning: 800 }, { day: 'Sat', earning: 1100 },
    { day: 'Sun', earning: 950 }
  ];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const currentDnaRate = dna?.evening_rate || 78;
  const baseRate = profile?.avg_hourly_earnings || 60;

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
        <Link href="/dashboard">
          <Button className="bg-primary hover:bg-primary-hover text-white font-bold shadow-btn rounded-btn h-11 px-6">
            🌧 Simulate Weather <Zap className="ml-2 h-4 w-4 fill-current" />
          </Button>
        </Link>
      </header>

      <div className="px-6 lg:px-10 space-y-8">
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-3">
          <motion.div variants={item}>
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
                    <p className="text-[10px] uppercase opacity-60">Coverage</p>
                    <p className="text-sm font-bold">₹{profile?.coverage || 240}</p>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <p className="text-[10px] uppercase opacity-60">Premium</p>
                    <p className="text-sm font-bold">₹{profile?.premium || 25}</p>
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
                  <div className="text-3xl font-bold text-heading">{profile?.riskScore || 35}%</div>
                  <Badge className="bg-info-bg text-info border-transparent">Monitoring</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-body">
                    <span>Disruption Risk</span>
                    <span className="text-warning">{profile?.riskScore || 35}%</span>
                  </div>
                  <Progress value={profile?.riskScore || 35} className="h-2 bg-muted/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-bg-card-yellow border-[#FEF3C7] shadow-card rounded-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-warning uppercase tracking-wider">Weather Alert</CardTitle>
                <AlertCircle className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-bold text-heading">AQI 142</div>
                  <Badge className="bg-warning-bg text-warning border-transparent">Caution</Badge>
                </div>
                <Button className="w-full bg-warning hover:bg-warning/90 text-white font-bold h-10 mt-2 rounded-btn">View Precautions</Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <Card className="bg-[#EDE9FF] border-[#D4CCFF] shadow-card rounded-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl font-headline font-bold text-heading">Earnings Protection Summary</CardTitle>
              <Badge className="bg-primary text-white border-none py-1.5 px-4 rounded-full font-bold">AI Dynamic Audit Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3 pt-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Potential Income Loss</p>
              <p className="text-2xl font-bold text-danger">₹{profile?.incomeLoss || Math.round(currentDnaRate * 6)}</p>
              <p className="text-[10px] text-body">AI-calculated based on current risk profile</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Insurance Coverage</p>
              <p className="text-2xl font-bold text-success">₹{profile?.coverage || 240}</p>
              <p className="text-[10px] text-body">Capped by {profile?.plan_id ? profile.plan_id.toUpperCase() : "PRO"} limit</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-body uppercase">Remaining Risk</p>
              <p className="text-2xl font-bold text-danger">₹{profile?.remainingRisk || 0}</p>
              <p className="text-[10px] text-body">Consider upgrading plan if gap is high</p>
            </div>
            <div className="md:col-span-3 bg-warning-bg p-3 rounded-lg border border-warning/20 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm font-medium text-warning">Your remaining risk is calculated dynamically. An increase in local risk or a change in your Income DNA will trigger a re-evaluation.</p>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-headline font-bold text-heading">Income DNA Profile</h2>
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-body">Your personalized earning pattern — used to calculate accurate payouts</p>
            </div>
            <p className="text-xs text-muted font-mono uppercase tracking-widest">Updated {dna?.updated_at?.seconds ? format(new Date(dna.updated_at.seconds * 1000), "HH:mm") : "Today"}</p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white border-border shadow-card rounded-card p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Expected Weekly Earnings</p>
                <div className="text-5xl font-bold text-primary">₹{dna?.weekly_earnings || 3360}</div>
                <p className="text-xs text-body mt-2">Derived from your Income DNA earning pattern</p>
              </div>
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase mb-1">Recommended Plan</p>
                  <p className="text-lg font-bold text-warning">{dna?.recommended_plan || "Elite Shield"}</p>
                </div>
                <Link href="/plans"><Button variant="outline" className="border-primary text-primary font-bold hover:bg-primary-light rounded-btn">Upgrade Plan</Button></Link>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Morning (6-10 AM)", rate: dna?.morning_rate || 45, mult: "0.75", val: 45, icon: "🌅" },
                { label: "Afternoon (12-4 PM)", rate: dna?.afternoon_rate || 57, mult: "0.95", val: 57, icon: "☀" },
                { label: "Evening (5-9 PM)", rate: dna?.evening_rate || 78, mult: "1.30", val: 78, icon: "🌆" },
                { label: "Night (9 PM-12 AM)", rate: dna?.night_rate || 51, mult: "0.85", val: 51, icon: "🌙" }
              ].map((slot, i) => (
                <Card key={i} className="bg-white border-border shadow-sm p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{slot.icon}</span>
                    <Badge className="bg-primary/10 text-primary text-[10px] font-bold border-none">{slot.mult}×</Badge>
                  </div>
                  <div><p className="text-[10px] font-bold text-muted uppercase truncate">{slot.label}</p><p className="text-xl font-bold text-heading">₹{slot.rate}/hr</p></div>
                  <Progress value={slot.val} className="h-1 mt-3" />
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Link href="/support"><Button className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-btn bg-primary hover:bg-primary-hover flex items-center gap-3"><Brain className="h-6 w-6 text-white" /><span className="font-bold">AI Support</span></Button></Link>
    </div>
  );
}
