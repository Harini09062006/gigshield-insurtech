"use client";

import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from "@/firebase";
import { collection, query, limit, doc, getDoc } from "firebase/firestore";
import { Shield, LayoutDashboard, Bell, Users, LogOut, Loader2, Lock, Headphones, Activity, ChevronRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * SECURE ADMIN DASHBOARD
 * Features robust RBAC (Role-Based Access Control) verification
 * preventing premature redirects and permission leaks.
 */
export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function verifyAdminSession() {
      // 1. Wait for Firebase Auth to determine user existence
      if (isUserLoading) return;

      // 2. If no user found after loading, send to primary login gate
      if (!user) {
        router.replace("/login");
        return;
      }

      // 3. Authenticated - Now strictly verify Firestore role
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          // Logged in but NOT an admin - send to landing page
          router.replace("/");
        }
      } catch (error) {
        console.error("Administrative verification failed:", error);
        router.replace("/");
      } finally {
        setCheckingAdmin(false);
      }
    }
    verifyAdminSession();
  }, [user, isUserLoading, db, router]);

  // Gate queries until role is confirmed to avoid permission errors
  const zonesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || checkingAdmin) return null;
    return query(collection(db, "disruption_zones"), limit(10));
  }, [db, isAdmin, checkingAdmin]);

  const { data: zones, isLoading: isZonesLoading } = useCollection(zonesQuery);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (isUserLoading || checkingAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
          <Lock className="absolute inset-0 m-auto h-4 w-4 text-[#6C47FF]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1A1A2E] animate-pulse uppercase tracking-widest">Establishing Secure Session...</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-widest mt-1">Authorized Access Only</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden font-body">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#E8E6FF] bg-white hidden md:flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#1A1A2E]">GigShield<span className="text-[#6C47FF] text-xs ml-1">ADMIN</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 bg-[#EDE9FF] text-[#6C47FF] font-bold h-11">
            <LayoutDashboard size={18} /> Overview
          </Button>
          <Button onClick={() => router.push('/admin/users')} variant="ghost" className="w-full justify-start gap-3 text-[#64748B] font-bold h-11 hover:bg-[#F5F3FF] hover:text-[#6C47FF]">
            <Users size={18} /> Workers
          </Button>
          <Button onClick={() => router.push('/admin/claims')} variant="ghost" className="w-full justify-start gap-3 text-[#64748B] font-bold h-11 hover:bg-[#F5F3FF] hover:text-[#6C47FF]">
            <Bell size={18} /> All Claims
          </Button>
          <Button onClick={() => router.push('/admin/support')} variant="ghost" className="w-full justify-start gap-3 text-[#64748B] font-bold h-11 hover:bg-[#F5F3FF] hover:text-[#6C47FF]">
            <Headphones size={18} /> Support Queue
          </Button>
        </nav>

        <div className="space-y-4">
          <div className="p-4 bg-[#F8F9FF] rounded-xl border border-[#E8E6FF]">
            <p className="text-[10px] font-black text-[#94A3B8] uppercase mb-1">System Health</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-xs font-bold text-[#1A1A2E]">Node-01 Active</span>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full text-[#EF4444] justify-start gap-3 font-bold hover:bg-[#FEE2E2]">
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A2E] tracking-tight">Admin Central</h1>
            <p className="text-[#64748B] text-sm mt-1">Real-time platform health and protection monitor</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-white border-[#E8E6FF] text-[#64748B] font-bold px-3 py-1">
              v2.4.0-PROD
            </Badge>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Workers", value: "1,248", icon: Users, color: "text-[#6C47FF]" },
            { label: "Active Policies", value: "892", icon: Shield, color: "text-[#22C55E]" },
            { label: "Live Disruptions", value: zones?.length ?? 0, icon: Activity, color: "text-[#EF4444]" },
            { label: "Total Payouts", value: "₹42,500", icon: Bell, color: "text-[#F59E0B]" }
          ].map((s, i) => (
            <Card key={i} className="p-6 bg-white border-[#E8E6FF] rounded-2xl shadow-sm hover:shadow-card transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-[#F8F9FF] ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <span className="text-[10px] font-black text-[#22C55E] bg-[#DCFCE7] px-2 py-0.5 rounded-full">+4%</span>
              </div>
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">{s.label}</p>
              <p className="text-3xl font-bold text-[#1A1A2E] mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Risk Zones Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
              Live Risk Zones <div className="h-2 w-2 rounded-full bg-[#EF4444] animate-ping" />
            </h2>
            <Button variant="ghost" size="sm" className="text-[#6C47FF] font-bold">
              View Map <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-white border border-[#E8E6FF] rounded-2xl overflow-hidden shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EEEEFF] border-b border-[#E8E6FF] font-bold text-[#94A3B8] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Zone Cluster</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Worker Density</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6FF]">
                {isZonesLoading ? (
                  <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#6C47FF]" /></td></tr>
                ) : zones && zones.length > 0 ? (
                  zones.map(z => (
                    <tr key={z.id} className="hover:bg-[#F8F9FF] transition-colors">
                      <td className="p-4 font-bold text-[#1A1A2E]">{z.zone_name || 'Urban Cluster'}</td>
                      <td className="p-4">
                        <Badge className={z.risk_level === 'extreme' ? 'bg-[#FEE2E2] text-[#DC2626] border-transparent font-bold' : 'bg-[#DCFCE7] text-[#22C55E] border-transparent font-bold'}>
                          {z.risk_level || 'stable'}
                        </Badge>
                      </td>
                      <td className="p-4 text-[#64748B] font-medium">{Math.floor(Math.random() * 50) + 10} partners</td>
                      <td className="p-4 font-mono font-bold text-[#1A1A2E]">{z.risk_score || 0}/100</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><ChevronRight size={16} /></Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-10 text-center text-[#94A3B8] italic">No active disruptions detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
