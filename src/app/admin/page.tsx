"use client";

import { useUser, useFirestore, useAuth } from "@/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Bell, Users, LogOut, Loader2, Lock, Headphones, Activity, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/**
 * SECURE ADMIN DASHBOARD
 * Handles asynchronous auth verification and role checking before rendering.
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
      // 1. Wait for Firebase Auth to finish initializing
      if (isUserLoading) return;

      // 2. If no user after loading, redirect to login
      if (!user) {
        console.log("Admin Guard: No user detected, redirecting to login");
        router.replace("/login");
        setCheckingAdmin(false);
        return;
      }

      // 3. Verify 'admin' role in Firestore
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

  // Loading UI while auth or role check is in progress
  if (isUserLoading || checkingAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
          <Lock className="absolute inset-0 m-auto h-4 w-4 text-[#6C47FF]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A2E] animate-pulse uppercase tracking-widest">Verifying Command Access...</p>
      </div>
    );
  }

  // Prevent flash of content if not admin
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
              <h1 className="text-3xl font-headline font-bold text-[#1A1A2E]">System Overview</h1>
              <p className="text-[#64748B]">Real-time intelligence and disruption management</p>
            </div>
            <div className="flex items-center gap-2 bg-[#DCFCE7] text-[#22C55E] px-4 py-2 rounded-full font-bold text-xs">
              <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              SYSTEMS OPERATIONAL
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Active Workers", value: "1,284", icon: Users, color: "text-[#6C47FF]", bg: "bg-[#EDE9FF]" },
              { label: "Pending Claims", value: "14", icon: Bell, color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
              { label: "Live Disruptions", value: "2", icon: Activity, color: "text-[#EF4444]", bg: "bg-[#FEE2E2]" }
            ].map((stat, i) => (
              <Card key={i} className="border-[#E8E6FF] shadow-card rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-[#94A3B8] uppercase">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#1A1A2E]">{stat.value}</div>
                  <p className="text-[10px] text-[#64748B] mt-1 font-medium">+12% from last 24h</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="space-y-6">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Review Claims", href: "/admin/claims", desc: "Process parametric payouts" },
                { title: "Support Queue", href: "/admin/support", desc: "Respond to escalated worker chats" },
                { title: "User Directory", href: "/admin/users", desc: "Manage worker profiles and DNA" },
                { title: "View Heatmap", href: "/heatmap", desc: "Monitor live city risk data" }
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <Card className="hover:border-[#6C47FF] hover:bg-[#F5F3FF] transition-all cursor-pointer border-[#E8E6FF] rounded-xl h-full p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#1A1A2E] flex items-center justify-between">
                        {action.title} <ChevronRight className="h-4 w-4 text-[#6C47FF]" />
                      </h3>
                      <p className="text-xs text-[#64748B] mt-1">{action.desc}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}
