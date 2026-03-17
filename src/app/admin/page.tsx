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
  
  const disruptionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "disruptionEvents"), limit(10));
  }, [db]);

  const { data: rawDisruptions, isLoading } = useCollection(disruptionsQuery);

  const disruptions = useMemo(() => {
    if (!rawDisruptions) return null;
    return [...rawDisruptions].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }, [rawDisruptions]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="w-64 border-r border-border/50 bg-card hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold text-heading">GigGuard<span className="text-primary text-sm ml-1 font-normal tracking-wider">ADMIN</span></span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2 bg-primary-light text-primary font-bold">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Button>
          <Link href="/admin/users" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted hover:text-primary font-bold">
              <Users className="h-4 w-4" /> Worker Directory
            </Button>
          </Link>
          <Link href="/admin/claims" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted hover:text-primary font-bold">
              <Bell className="h-4 w-4" /> Manage Claims
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted hover:text-primary font-bold">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Button>
        </nav>
        <div className="p-6 border-t border-border/50">
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
              <Input placeholder="Search system..." className="pl-9 h-9 rounded-btn" />
            </div>
          </div>
        </header>

        <StatsOverview />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-bold text-heading">Live Disruption Events</h2>
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
                  <th className="p-4">Location</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Impact (Workers)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-muted">Loading live events...</td></tr>
                ) : disruptions && disruptions.length > 0 ? (
                  disruptions.map((event) => (
                    <tr key={event.id} className="hover:bg-primary-light transition-colors">
                      <td className="p-4 font-medium text-heading">{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</td>
                      <td className="p-4 text-body">
                        {event.timestamp ? format(new Date(event.timestamp), "MMM dd, HH:mm") : "Real-time"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-heading">{event.workersAffectedCount}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-info-bg text-info border-transparent font-semibold">
                          ACTIVE MONITORING
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary-light h-8 font-bold">Resolve</Button>
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