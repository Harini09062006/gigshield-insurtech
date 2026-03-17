"use client";

import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map, Bell, Users, BarChart3, LogOut, Search, Filter, AlertCircle } from "lucide-react";
import { StatsOverview } from "@/components/admin/stats-overview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminDashboard() {
  const db = useFirestore();
  const disruptionsQuery = query(collection(db, "disruptionEvents"), orderBy("timestamp", "desc"), limit(5));
  const { data: disruptions, isLoading } = useCollection(disruptionsQuery);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50 bg-card">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-headline font-bold">GigGuard<span className="text-primary">Admin</span></span>
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
                <Link href="/admin/users">
                  <SidebarMenuButton>
                    <Users className="h-4 w-4" />
                    <span>Worker Management</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/claims">
                  <SidebarMenuButton>
                    <Bell className="h-4 w-4" />
                    <span>All Claims</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart3 className="h-4 w-4" />
                  <span>System Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border/50">
            <Link href="/" className="w-full">
              <SidebarMenuButton className="text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </Link>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold">Admin Central</h1>
              <p className="text-muted-foreground">Platform health and worker protection monitor</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search system..." className="pl-9 h-9" />
              </div>
            </div>
          </header>

          <StatsOverview />

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold">Live Disruption Events</h2>
              <Link href="/heatmap">
                <Button size="sm" variant="link" className="text-primary font-bold">
                  View Live Map <Map className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 font-bold uppercase text-xs tracking-wider border-b border-border/50">
                  <tr>
                    <th className="p-4">Location (Lat/Lon)</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Impact (Workers)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center">Loading live events...</td></tr>
                  ) : disruptions && disruptions.length > 0 ? (
                    disruptions.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</td>
                        <td className="p-4 text-muted-foreground">
                          {event.timestamp ? format(new Date(event.timestamp), "MMM dd, HH:mm") : "Real-time"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{event.workersAffectedCount}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                            Active Monitoring
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" className="text-primary h-8">Resolve</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No active disruptions detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}