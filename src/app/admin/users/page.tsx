"use client";

import { useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map as MapIcon, Bell, Users, BarChart3, LogOut, Search, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function AdminUsers() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "userProfiles"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: users, isLoading } = useCollection(usersQuery);

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
              <span className="text-xl font-headline font-bold">GigGuard<span className="text-primary">Admin</span></span>
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
                <SidebarMenuButton>
                  <BarChart3 className="h-4 w-4" />
                  <span>System Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border/50">
            <SidebarMenuButton onClick={handleLogout} className="text-destructive">
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
                <Input placeholder="Search workers..." className="pl-9 h-9 rounded-btn" />
              </div>
            </div>
          </header>

          <section className="rounded-card border border-border bg-white shadow-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-page font-bold uppercase text-xs tracking-wider text-muted border-b border-border">
                <tr>
                  <th className="p-4">Worker</th>
                  <th className="p-4">Email</th>
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
                      <td className="p-4 font-medium text-heading">{user.name || "Anonymous Worker"}</td>
                      <td className="p-4 text-body flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary" /> {user.email}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize border-primary text-primary bg-primary-light">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-body flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-primary" />
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