"use client";

import { ReactNode } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map, Bell, User, LogOut, FileText, Package } from "lucide-react";
import Link from "next/link";
import { useAuth, useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { AIAssistant } from "@/components/chatbot/AIAssistant";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isUserLoading && !user) {
    router.push("/auth/login");
    return null;
  }

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50 bg-card">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-headline font-bold">GigShield</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/worker/overview" className="w-full">
                  <SidebarMenuButton isActive={pathname === "/worker/overview"}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/worker/income-dna" className="w-full">
                  <SidebarMenuButton isActive={pathname === "/worker/income-dna"}>
                    <User className="h-4 w-4" />
                    <span>Income DNA</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/worker/plans" className="w-full">
                  <SidebarMenuButton isActive={pathname === "/worker/plans"}>
                    <Package className="h-4 w-4" />
                    <span>Protection Plans</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/worker/claims" className="w-full">
                  <SidebarMenuButton isActive={pathname === "/worker/claims"}>
                    <FileText className="h-4 w-4" />
                    <span>My Claims</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/heatmap" className="w-full">
                  <SidebarMenuButton isActive={pathname === "/heatmap"}>
                    <Map className="h-4 w-4" />
                    <span>Live Heatmap</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border/50">
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}
