"use client";

import { useUser, useFirestore, useAuth } from "@/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Bell, Users, LogOut, Loader2, Lock, Headphones, Activity, ChevronRight, Zap, AlertTriangle, TrendingUp, Globe, MapPin, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * PRODUCTION ADMIN DASHBOARD
 * Features robust auth verification and role checking.
 * UI includes Stats, Risk Scores, City Cards, and System Overrides.
 */
export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function verifyAccess() {
      // 1. Wait for Firebase Auth to finish initializing before any decision
      if (isUserLoading) return;

      // 2. If definitely no user after loading, redirect to login
      if (!user) {
        console.log("Admin Guard: No user detected, redirecting to login");
        router.replace("/login");
        setCheckingAdmin(false);
        return;
      }

      // 3. Verify 'admin' role in Firestore explicitly
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          console.warn("Admin Guard: User lacks admin role, redirecting to home");
          router.replace("/");
        }
      } catch (error) {
        console.error("Admin Guard: Firestore verification failed", error);
        router.replace("/");
      } finally {
        setCheckingAdmin(false);
      }
    }
    verifyAccess();
  }, [user, isUserLoading, db, router]);

  if (isUserLoading || checkingAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
          <Lock className="absolute inset-0 m-auto h-4 w-4 text-[#6C47FF]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1A1A2E] animate-pulse uppercase tracking-widest">Verifying Command Access...</p>
          <p className="text-[10px] text-[#64748B] mt-1">Authorized Personnel Only</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden font-body">
        <Sidebar className="border-r border-[#E8E6FF] bg-white">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#6C47FF]" />
              <span className="text-xl font-headline font-bold text-[#1A1A2E]">GigShield<span className="text-[#6C47FF] text-xs ml-1">ADMIN</span></span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/users"><SidebarMenuButton><Users className="h-4 w-4" /><span>Worker Directory</span></SidebarMenuButton></Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/claims"><SidebarMenuButton><Bell className="h-4 w-4" /><span>Claims Queue</span></SidebarMenuButton></Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/support"><SidebarMenuButton><Headphones className="h-4 w-4" /><span>Support Desk</span></SidebarMenuButton></Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-[#E8E6FF]">
            <SidebarMenuButton onClick={() => auth.signOut().then(() => router.push("/"))} className="text-[#EF4444] font-bold">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-[#1A1A2E]">Intelligence Command</h1>
              <p className="text-[#64748B]">Real-time disruption management and system oversight</p>
            </div>
            <div className="flex items-center gap-2 bg-[#DCFCE7] text-[#22C55E] px-4 py-2 rounded-full font-bold text-xs shadow-sm">
              <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              ENGINE OPERATIONAL
            </div>
          </header>

          {/* 1. TOP STATS CARDS */}
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { label: "Active Workers", value: "1,284", sub: "+12% vs last 24h", icon: Users, color: "text-[#6C47FF]", bg: "bg-[#EDE9FF]" },
              { label: "Risk Events", value: "14", sub: "3 Critical Disruptions", icon: AlertTriangle, color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
              { label: "Pending Claims", value: "22", sub: "₹12,400 processing", icon: Bell, color: "text-[#3B82F6]", bg: "bg-[#DBEAFE]" },
              { label: "Total Payouts", value: "₹4.2L", sub: "Automated verification", icon: Zap, color: "text-[#22C55E]", bg: "bg-[#DCFCE7]" }
            ].map((stat, i) => (
              <Card key={i} className="border-[#E8E6FF] shadow-card rounded-2xl bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-[#94A3B8] uppercase">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#1A1A2E]">{stat.value}</div>
                  <p className="text-[10px] text-[#64748B] mt-1 font-medium">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* 2. WEEKLY RISK SCORE */}
            <Card className="md:col-span-2 border-[#E8E6FF] shadow-card rounded-2xl bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-[#1A1A2E]">Weekly Risk Velocity</CardTitle>
                  <CardDescription className="text-xs">Aggregate city-wide disruption probability</CardDescription>
                </div>
                <Badge className="bg-[#6C47FF] text-white py-1 px-3">LEVEL: ELEVATED</Badge>
              </CardHeader>
              <CardContent className="h-[240px] flex items-end justify-between gap-2 pt-10">
                {[45, 65, 40, 85, 95, 75, 60].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-[#F5F3FF] rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`absolute bottom-0 w-full rounded-t-lg transition-colors ${height > 80 ? 'bg-[#EF4444]' : height > 60 ? 'bg-[#F59E0B]' : 'bg-[#6C47FF]'}`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-[#94A3B8]">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 3. SYSTEM STATUS PANEL */}
            <Card className="border-[#E8E6FF] shadow-card rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#1A1A2E]">Node Status</CardTitle>
                <CardDescription className="text-xs">Cloud infrastructure health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: "Auth Server", status: "Online", latency: "12ms" },
                  { label: "Weather Feed", status: "Syncing", latency: "420ms" },
                  { label: "Claim Engine", status: "Online", latency: "8ms" },
                  { label: "Payout API", status: "Online", latency: "156ms" }
                ].map((node, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${node.status === 'Online' ? 'bg-[#22C55E]' : 'bg-[#F59E0B] animate-pulse'}`} />
                      <span className="text-sm font-bold text-[#1A1A2E]">{node.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#64748B]">{node.latency}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-[#E8E6FF]">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Active Administrator</p>
                  <div className="flex items-center gap-3 bg-[#F8F9FF] p-3 rounded-xl border border-[#E8E6FF]">
                    <div className="h-8 w-8 rounded-full bg-[#6C47FF] flex items-center justify-center text-white font-bold text-xs">A</div>
                    <div>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">{user.email?.split('@')[0]}</p>
                      <p className="text-[9px] text-[#22C55E] font-bold uppercase">Root Privilege</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4. CITY RISK CARDS */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Live City Risk Intelligence</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Mumbai", state: "Maharashtra", rain: "65mm", risk: "CRITICAL", color: "text-[#EF4444]", bg: "bg-[#FEE2E2]" },
                { name: "Bengaluru", state: "Karnataka", rain: "12mm", risk: "STABLE", color: "text-[#22C55E]", bg: "bg-[#DCFCE7]" },
                { name: "Delhi NCR", state: "Delhi", rain: "0mm", risk: "ELEVATED", color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" }
              ].map((city, i) => (
                <Card key={i} className="border-[#E8E6FF] shadow-card rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden group">
                  <div className={`h-1.5 w-full ${city.bg.replace('bg-', 'bg-')}`} style={{ background: city.color === 'text-[#EF4444]' ? '#EF4444' : city.color === 'text-[#F59E0B]' ? '#F59E0B' : '#22C55E' }} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold text-[#1A1A2E]">{city.name}</CardTitle>
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{city.state}</p>
                      </div>
                      <Globe className="h-4 w-4 text-[#94A3B8] group-hover:text-[#6C47FF] transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-bold text-[#64748B] uppercase">Rainfall</p>
                        <p className="text-xl font-black text-[#1A1A2E]">{city.rain}</p>
                      </div>
                      <Badge className={`${city.bg} ${city.color} border-none font-bold text-[10px]`}>{city.risk}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-[#6C47FF] font-bold text-[10px] h-8 bg-[#F5F3FF] hover:bg-[#EDE9FF]">VIEW HEATMAP</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            {/* 5. DELIVERY RISK MAP (ZONES) */}
            <Card className="border-[#E8E6FF] shadow-card rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-[#F8F9FF] border-b border-[#E8E6FF]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-[#1A1A2E]">Active Zones: Mumbai</CardTitle>
                    <p className="text-xs text-[#64748B]">Real-time GPS disruption overlay</p>
                  </div>
                  <MapPin className="text-[#6C47FF] h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#E8E6FF]">
                  {[
                    { zone: "South Mumbai", status: "HIGH", count: 42 },
                    { zone: "Andheri", status: "MEDIUM", count: 156 },
                    { zone: "Bandra West", status: "MEDIUM", count: 89 },
                    { zone: "Dadar Central", status: "LOW", count: 212 }
                  ].map((z, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-[#F8F9FF] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${z.status === 'HIGH' ? 'bg-[#FEE2E2] text-[#EF4444]' : z.status === 'MEDIUM' ? 'bg-[#FEF3C7] text-[#F59E0B]' : 'bg-[#DCFCE7] text-[#22C55E]'}`}>
                          {z.zone[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A1A2E]">{z.zone}</p>
                          <p className="text-[10px] text-[#64748B] font-medium">{z.count} Active Workers</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-black tracking-tighter ${z.status === 'HIGH' ? 'border-[#EF4444] text-[#EF4444]' : z.status === 'MEDIUM' ? 'border-[#F59E0B] text-[#F59E0B]' : 'border-[#22C55E] text-[#22C55E]'}`}>
                        {z.status} RISK
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 6. SYSTEM OVERRIDE PANEL */}
            <Card className="border-[#E8E6FF] shadow-card rounded-2xl bg-[#1A1A2E] text-white">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Power className="h-4 w-4 text-[#EF4444]" />
                  <CardTitle className="text-lg font-bold">Manual System Override</CardTitle>
                </div>
                <CardDescription className="text-[#94A3B8] text-xs">Emergency control for parametric triggers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-4">
                {[
                  { label: "Global Payout Freeze", desc: "Instantly stop all automated claim processing", active: false },
                  { label: "City-Wide Disruption", desc: "Manual trigger for Mumbai (65mm Rainfall)", active: true },
                  { label: "Force Data Refresh", desc: "Sync all weather nodes immediately", active: false }
                ].map((control, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold">{control.label}</p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">{control.desc}</p>
                    </div>
                    <Switch 
                      className={`data-[state=checked]:bg-[#6C47FF]`} 
                      defaultChecked={control.active}
                    />
                  </div>
                ))}
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-[#EF4444] font-bold text-xs uppercase tracking-widest">
                    <AlertTriangle className="h-4 w-4" /> Priority Warning
                  </div>
                  <p className="text-[10px] text-[#FEE2E2]">Manual overrides bypass AI verification protocols. All actions are logged under root credentials.</p>
                  <Button className="w-full bg-[#EF4444] hover:bg-[#DC2626] font-bold h-10 shadow-lg">INITIALIZE EMERGENCY LOCK</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
