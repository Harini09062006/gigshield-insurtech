"use client";

import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map, Bell, Users, BarChart3, LogOut, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function AdminClaims() {
  const db = useFirestore();
  const { toast } = useToast();
  const claimsQuery = query(collection(db, "claims"), orderBy("createdAt", "desc"));
  const { data: claims, isLoading } = useCollection(claimsQuery);

  const updateStatus = async (claimId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, "claims", claimId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Claim ${status}`, description: `The claim has been successfully ${status}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
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
                <Link href="/admin/users">
                  <SidebarMenuButton>
                    <Users className="h-4 w-4" />
                    <span>Worker Management</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Bell className="h-4 w-4" />
                  <span>All Claims</span>
                </SidebarMenuButton>
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
              <h1 className="text-3xl font-headline font-bold">Claim Management</h1>
              <p className="text-muted-foreground">Review and process worker insurance claims</p>
            </div>
          </header>

          <section className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-bold uppercase text-xs tracking-wider border-b border-border/50">
                <tr>
                  <th className="p-4">Worker ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="p-4"><Skeleton className="h-8 w-full" /></td>
                    </tr>
                  ))
                ) : claims && claims.length > 0 ? (
                  claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-mono text-[10px] text-muted-foreground">{claim.userId}</td>
                      <td className="p-4 font-bold">₹{claim.claim_amount}</td>
                      <td className="p-4 capitalize">{claim.time_slot}</td>
                      <td className="p-4">
                        <Badge variant={claim.status === 'approved' ? 'default' : claim.status === 'rejected' ? 'destructive' : 'outline'} className={claim.status === 'approved' ? 'bg-green-500' : ''}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {claim.createdAt?.seconds ? format(new Date(claim.createdAt.seconds * 1000), "MMM dd, HH:mm") : "Just now"}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        {claim.status === 'pending' && (
                          <>
                            <Button size="icon" variant="ghost" className="text-green-500 hover:bg-green-500/10" onClick={() => updateStatus(claim.id, 'approved')}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => updateStatus(claim.id, 'rejected')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" className="h-8">Details</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">No claims filed yet.</td>
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