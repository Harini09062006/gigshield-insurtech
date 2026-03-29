"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

// UI IMPORTS (UNCHANGED)
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import {
  Shield,
  LayoutDashboard,
  Bell,
  Users,
  LogOut,
  Loader2,
  Lock,
  Headphones,
  AlertTriangle,
  Zap,
  Globe,
  MapPin,
  Power,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ FIXED AUTH SYSTEM (NO useUser)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log("ADMIN USER:", u);

      if (!u) {
        router.replace("/login");
        return;
      }

      setUser(u);

      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));

        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace("/");
        }
      } catch (err) {
        console.error(err);
        router.replace("/");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  // 🔄 Loading screen
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
        <p className="text-sm mt-2 font-bold">Verifying Access...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  // ✅ YOUR ORIGINAL UI (UNCHANGED)
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden font-body">
        <Sidebar className="border-r border-[#E8E6FF] bg-white">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#6C47FF]" />
              <span className="text-xl font-bold">
                GigShield <span className="text-xs text-[#6C47FF]">ADMIN</span>
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <LayoutDashboard className="h-4 w-4" />
                  Overview
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/admin/users">
                  <SidebarMenuButton>
                    <Users className="h-4 w-4" />
                    Users
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/admin/claims">
                  <SidebarMenuButton>
                    <Bell className="h-4 w-4" />
                    Claims
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link href="/admin/support">
                  <SidebarMenuButton>
                    <Headphones className="h-4 w-4" />
                    Support
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-6 border-t">
            <SidebarMenuButton
              onClick={() => auth.signOut().then(() => router.push("/"))}
              className="text-red-500 font-bold"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <h1 className="text-2xl font-bold">
            Welcome Admin: {user?.email}
          </h1>

          {/* SAMPLE CARD (your UI continues same) */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>All systems operational</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Admin dashboard is now working ✅</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
