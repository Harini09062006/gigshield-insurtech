"use client";

import { ReactNode } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map as MapIcon, Bell, User, LogOut, FileText, Package } from "lucide-react";
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
      <div className="flex h-screen w-full bg-bg-page overflow-hidden">
        <Sidebar className="border-r border-border bg-white">
          <SidebarHeader className="p-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-headline font-bold">
                <span className="text-primary">Gig</span>
                <span className="text-heading">Shield</span>
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/worker/overview" className="w-full">
                  <SidebarMenuButton 
                    isActive={pathname === "/worker/overview"}
                    className={pathname === "/worker/overview" ? "text-primary bg-primary-light" : "text-muted hover:text-primary hover:bg-primary-light"}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="font-bold">Overview</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/worker/income-dna" className="w-full">
                  <SidebarMenuButton 
                    isActive={pathname === "/worker/income-dna"}
                    className={pathname === "/worker/income-dna" ? "text-primary bg-primary-light" : "text-muted hover:text-primary hover:bg-primary-light"}
                  >
                    <User className="h-4 w-4" />
                    <span className="font-bold">Income DNA</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/worker/plans" className="w-full">
                  <SidebarMenuButton 
                    isActive={pathname === "/worker/plans"}
                    className={pathname === "/worker/plans" ? "text-primary bg-primary-light" : "text-muted hover:text-primary hover:bg-primary-light"}
                  >
                    <Package className="h-4 w-4" />
                    <span className="font-bold">Protection Plans</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/worker/claims" className="w-full">
                  <SidebarMenuButton 
                    isActive={pathname === "/worker/claims"}
                    className={pathname === "/worker/claims" ? "text-primary bg-primary-light" : "text-muted hover:text-primary hover:bg-primary-light"}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="font-bold">My Claims</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/heatmap" className="w-full">
                  <SidebarMenuButton 
                    isActive={pathname === "/heatmap"}
                    className={pathname === "/heatmap" ? "text-primary bg-primary-light" : "text-muted hover:text-primary hover:bg-primary-light"}
                  >
                    <MapIcon className="h-4 w-4" />
                    <span className="font-bold">Live Heatmap</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border">
            <SidebarMenuButton onClick={handleLogout} className="text-danger hover:bg-danger-bg hover:text-danger rounded-btn transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="font-bold">Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
}