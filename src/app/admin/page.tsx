
"use client";

import { useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, limit } from "firebase/firestore";
import { Shield, LayoutDashboard, Map as MapIcon, Bell, Users, BarChart3, LogOut, Search } from "lucide-react";
import { StatsOverview } from "@/components/admin/stats-overview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const zonesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "disruption_zones"), limit(10));
  }, [db]);

  const { data: zones, isLoading } = useCollection(zonesQuery);

  const sortedZones = useMemo(() => {
    if (!zones) return null;
    return [...zones].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
  }, [zones]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen w-full bg-bg-page overflow-hidden">
      <aside className="w-64 border-r border-border bg-white hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-headline font-bold text-heading">GigGuard<span className="text-primary text-sm ml-1 font-normal tracking-wider">ADMIN</span></span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2 bg-primary-light text-primary font-bold">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Button>
          <Link href="/admin/users" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2 text-body hover:text-primary font-bold">
              <Users className="h-4 w-4" /> Worker Directory
            </Button>
          </Link>
          <Link href="/admin/claims" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2 text-body hover:text-primary font-bold">
              <Bell className="h-4 w-4" /> Manage Claims
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2 text-body hover:text-primary font-bold">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Button>
        </nav>
        <div className="p-6 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-danger hover:bg-danger-bg font-bold"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-heading">Admin Central</h1>
            <p className="text-body">Platform health and worker protection monitor</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
              <Input placeholder="Search system..." className="pl-9 h-9 rounded-btn bg-white border-border" />
            </div>
          </div>
        </header>

        <StatsOverview />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-bold text-heading">Live Disruption Zones</h2>
            <Link href="/heatmap">
              <Button size="sm" variant="link" className="text-primary font-bold">
                View Live Map <MapIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="rounded-card border border-border bg-white shadow-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-page font-bold uppercase text-xs tracking-wider text-muted border-b border-border">
                <tr>
                  <th className="p-4">Zone</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-muted">Loading live events...</td></tr>
                ) : sortedZones && sortedZones.length > 0 ? (
                  sortedZones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-primary-light transition-colors">
                      <td className="p-4 font-bold text-heading">{zone.zone_name || zone.zone}</td>
                      <td className="p-4 text-body">{zone.city}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`capitalize font-bold ${
                          zone.risk_level === 'extreme' ? 'bg-danger-bg text-danger border-danger' : 
                          zone.risk_level === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                          'bg-success-bg text-success border-success'
                        }`}>
                          {zone.risk_level}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono font-bold text-heading">{zone.risk_score}/100</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary-light h-8 font-bold">Details</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-10 text-center text-muted italic">No active disruptions detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
