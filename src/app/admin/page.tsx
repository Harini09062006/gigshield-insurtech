"use client";

import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from "@/firebase";
import { collection, query, limit, doc, getDoc } from "firebase/firestore";
import { Shield, LayoutDashboard, Map as MapIcon, Bell, Users, BarChart3, LogOut, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace("/dashboard");
        }
      } else if (!isUserLoading) {
        router.replace("/login");
      }
      setCheckingAdmin(false);
    }
    checkRole();
  }, [user, isUserLoading, db, router]);

  const zonesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, "disruption_zones"), limit(10));
  }, [db, isAdmin]);

  const { data: zones, isLoading: isZonesLoading } = useCollection(zonesQuery);

  if (isUserLoading || checkingAdmin) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;
  if (!isAdmin) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden font-body">
      <aside className="w-64 border-r border-[#E8E6FF] bg-white hidden md:flex flex-col p-6 space-y-8">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn"><Shield className="text-white" /></div>
          <span className="text-xl font-bold text-[#1A1A2E]">GigShield<span className="text-[#6C47FF] text-xs ml-1">ADMIN</span></span>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2 bg-[#EDE9FF] text-[#6C47FF] font-bold"><LayoutDashboard size={18} /> Overview</Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-[#64748B] font-bold"><Users size={18} /> Workers</Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-[#64748B] font-bold"><Bell size={18} /> Claims</Button>
        </nav>
        <Button onClick={() => auth.signOut().then(() => router.push("/login"))} variant="ghost" className="text-[#EF4444] justify-start gap-2 font-bold"><LogOut size={18} /> Logout</Button>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
        <header>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Admin Central</h1>
          <p className="text-[#64748B] text-sm">Platform health and worker protection monitor</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Workers", value: "1,248" },
            { label: "Active Policies", value: "892" },
            { label: "Live Disruptions", value: zones?.length ?? 0 },
            { label: "Total Payouts", value: "₹42,500" }
          ].map((s, i) => (
            <Card key={i} className="p-6 bg-white border-[#E8E6FF] rounded-2xl shadow-sm">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-[#1A1A2E]">{s.value}</p>
            </Card>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#1A1A2E]">Live Risk Zones</h2>
          <div className="bg-white border border-[#E8E6FF] rounded-2xl overflow-hidden shadow-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEEEFF] border-b border-[#E8E6FF] font-bold text-[#94A3B8] uppercase tracking-wider">
                <tr><th className="p-4">Zone</th><th className="p-4">Risk Level</th><th className="p-4">Score</th></tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6FF]">
                {isZonesLoading ? <tr><td colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#6C47FF]" /></td></tr> : 
                  zones?.map(z => (
                    <tr key={z.id}>
                      <td className="p-4 font-bold">{z.zone_name}</td>
                      <td className="p-4"><Badge className={z.risk_level === 'extreme' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#22C55E]'}>{z.risk_level}</Badge></td>
                      <td className="p-4 font-mono font-bold">{z.risk_score}/100</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </motion.div>
  );
}