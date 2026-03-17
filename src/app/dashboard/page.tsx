
"use client";

import { useState, useEffect } from "react";
import { generateIncomeDNA, IncomeDNAOutput } from "@/ai/flows/income-dna-flow";
import { MOCK_WORKER_PROFILE } from "@/lib/mock-data";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map, Bell, User, LogOut, ChevronRight, IndianRupee } from "lucide-react";
import { PolicyCard } from "@/components/dashboard/policy-card";
import { IncomeDNACharts } from "@/components/dashboard/income-dna-charts";
import { DisruptionAlerts } from "@/components/dashboard/disruption-alerts";
import { PlanRecommendation } from "@/components/dashboard/plan-recommendation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function WorkerDashboard() {
  const [dna, setDna] = useState<IncomeDNAOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDNA() {
      try {
        const result = await generateIncomeDNA({
          workerId: MOCK_WORKER_PROFILE.id,
          workEntries: MOCK_WORKER_PROFILE.lastEarningSnapshot
        });
        setDna(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadDNA();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50 bg-card">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-headline font-bold">GigGuard<span className="text-primary">AI</span></span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/heatmap" className="w-full">
                  <SidebarMenuButton>
                    <Map className="h-4 w-4" />
                    <span>Live Heatmap</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Bell className="h-4 w-4" />
                  <span>Alerts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border/50">
            <Link href="/" className="w-full">
              <SidebarMenuButton className="text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </Link>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold">Worker Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {MOCK_WORKER_PROFILE.name}</p>
            </div>
            <div className="flex items-center gap-4 bg-muted/40 p-2 rounded-lg border border-border/50">
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase">Protection Status</p>
                <p className="text-sm font-bold text-primary flex items-center justify-end gap-1">
                  Verified Active <Shield className="h-3 w-3" />
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-headline font-bold">Policy Overview</h2>
                  <Link href="#" className="text-sm text-primary flex items-center hover:underline">
                    Manage Plan <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <PolicyCard 
                  planId={MOCK_WORKER_PROFILE.currentPlanId}
                  week={MOCK_WORKER_PROFILE.policyWeek}
                  startDate={MOCK_WORKER_PROFILE.policyStartDate}
                  autoRenew={MOCK_WORKER_PROFILE.autoRenew}
                />
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-headline font-bold">Income DNA Insights</h2>
                {loading ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                  </div>
                ) : dna && (
                  <IncomeDNACharts data={dna} />
                )}
              </section>
            </div>

            <aside className="space-y-8">
              <section>
                <DisruptionAlerts />
              </section>
              <section>
                {dna && <PlanRecommendation incomeDNA={dna} />}
              </section>
              <section className="p-6 bg-card rounded-xl border border-border/50 relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-lg font-headline font-bold mb-2">Live Heatmap</h3>
                  <p className="text-sm text-muted-foreground mb-4">Visualize disruption clusters and high-earning zones across India in real-time.</p>
                  <Link href="/heatmap">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      Open Heatmap <Map className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Map className="h-32 w-32" />
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
