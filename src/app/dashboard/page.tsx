
"use client";

import { useState, useEffect } from "react";
import { generateIncomeDNA, IncomeDNAOutput } from "@/ai/flows/income-dna-flow";
import { MOCK_WORKER_PROFILE } from "@/lib/mock-data";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map as MapIcon, Bell, User, LogOut, ChevronRight, Loader2 } from "lucide-react";
import { PolicyCard } from "@/components/dashboard/policy-card";
import { IncomeDNACharts } from "@/components/dashboard/income-dna-charts";
import { DisruptionAlerts } from "@/components/dashboard/disruption-alerts";
import { PlanRecommendation } from "@/components/dashboard/plan-recommendation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function WorkerDashboard() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "userProfiles", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  const policiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "userProfiles", user.uid, "policies");
  }, [db, user]);

  const { data: policies, isLoading: isPoliciesLoading } = useCollection(policiesQuery);

  const [dna, setDna] = useState<IncomeDNAOutput | null>(null);
  const [dnaLoading, setDnaLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    async function loadDNA() {
      setDnaLoading(true);
      try {
        const result = await generateIncomeDNA({
          workerId: user.uid,
          workEntries: MOCK_WORKER_PROFILE.lastEarningSnapshot
        });
        setDna(result);
      } catch (error) {
        console.error(error);
      } finally {
        setDnaLoading(false);
      }
    }
    loadDNA();
  }, [user]);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

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
                    <MapIcon className="h-4 w-4" />
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
              <p className="text-muted-foreground">Welcome back, {profile?.email || user.email || 'Worker'}</p>
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
                {isPoliciesLoading ? (
                   <Skeleton className="h-[200px] w-full rounded-xl" />
                ) : policies && policies.length > 0 ? (
                  <div className="grid gap-4">
                    {policies.map(p => (
                      <PolicyCard 
                        key={p.id}
                        planName={p.planName}
                        week={p.currentWeek}
                        startDate={p.startDate}
                        autoRenew={p.autoRenew}
                        costPerWeek={p.weeklyPremium}
                        maxPayout={p.maxPayout}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-card/30 border border-dashed border-border/50 rounded-xl text-center">
                    <p className="text-muted-foreground mb-4">No active policies found.</p>
                    <Button variant="outline">Browse Protection Plans</Button>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-headline font-bold">Income DNA Insights</h2>
                {dnaLoading ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                    <Skeleton className="h-[250px] w-full rounded-xl" />
                  </div>
                ) : dna ? (
                  <IncomeDNACharts data={dna} />
                ) : (
                  <div className="p-8 bg-card/30 border border-border/50 rounded-xl text-center">
                    <p className="text-muted-foreground">Sign in or refresh to generate your Income DNA.</p>
                  </div>
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
                      Open Heatmap <MapIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MapIcon className="h-32 w-32" />
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
