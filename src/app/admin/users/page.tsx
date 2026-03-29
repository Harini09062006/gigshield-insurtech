"use client";

import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from "@/firebase";
import { collection, query, orderBy, getDoc, doc } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Bell, Users, LogOut, Search, Calendar, Loader2, Lock, Headphones } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminUsers() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (isUserLoading) return;
      
      if (!user) {
        router.replace("/login");
        setCheckingAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace("/");
        }
      } catch (error) {
        console.error("Role check failed", error);
        router.replace("/");
      } finally {
        setCheckingAdmin(false);
      }
    }
    checkRole();
  }, [user, isUserLoading, db, router]);
  
  const usersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || checkingAdmin) return null;
    return query(collection(db, "users"), orderBy("createdAt", "desc"));
  }, [db, isAdmin, checkingAdmin]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (isUserLoading || checkingAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
          <Lock className="absolute inset-0 m-auto h-4 w-4 text-[#6C47FF]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A2E] animate-pulse">Checking security credentials...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-bg-page overflow-hidden">
        <Sidebar className="border-r border-border bg-white">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-headline font-bold">GigShield<span className="text-primary text-xs ml-1">ADMIN</span></span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin">
                  <SidebarMenuButton>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Users className="h-4 w-4" />
                  <span>Worker Management</span>
                </SidebarMenuButton>
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
                <Link href="/admin/support">
                  <SidebarMenuButton>
                    <Headphones className="h-4 w-4" />
                    <span>Support Queue</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border">
            <SidebarMenuButton onClick={handleLogout} className="text-danger font-bold">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-heading">Worker Directory</h1>
              <p className="text-body">Manage all registered workers and their protection status</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
                <Input placeholder="Search workers..." className="pl-9 h-9 rounded-btn bg-white border-border" />
              </div>
            </div>
          </header>

          <section className="rounded-card border border-border bg-white shadow-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-page font-bold uppercase text-xs tracking-wider text-muted border-b border-border">
                <tr>
                  <th className="p-4">Worker</th>
                  <th className="p-4">Platform</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="p-4"><Skeleton className="h-8 w-full" /></td>
                    </tr>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-primary-light transition-colors">
                      <td className="p-4 font-bold text-heading">{user.name || "Anonymous Worker"}</td>
                      <td className="p-4 text-body font-medium">{user.platform || 'Not set'}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`capitalize border-primary text-primary font-bold ${user.role === 'admin' ? 'bg-primary text-white' : 'bg-primary-light'}`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-body text-xs">
                        <Calendar className="h-3 w-3 inline mr-1 text-primary" />
                        {user.createdAt?.seconds ? format(new Date(user.createdAt.seconds * 1000), "MMM dd, yyyy") : "Recently"}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary-light h-8">View DNA</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted italic">No workers registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}
