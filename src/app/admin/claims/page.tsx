"use client";

import { useFirestore, useCollection, useMemoFirebase, useAuth, useUser } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Bell, Users, LogOut, CheckCircle2, XCircle, Loader2, Lock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminClaims() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
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
  
  const claimsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || checkingAdmin) return null;
    return query(collection(db, "claims"), orderBy("created_at", "desc"));
  }, [db, isAdmin, checkingAdmin]);

  const { data: claims, isLoading, error } = useCollection(claimsQuery);

  const updateStatus = async (claimId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, "claims", claimId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast({ 
        title: `Claim ${status === 'approved' ? 'Approved' : 'Rejected'}`, 
        description: `The claim has been successfully ${status}.` 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: error.message || "You do not have permission to update claims." 
      });
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  if (isUserLoading || checkingAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EEEEFF] space-y-4">
        <div className="relative">
          <Loader2 className="animate-spin text-[#6C47FF] h-12 w-12" />
          <Lock className="absolute inset-0 m-auto h-4 w-4 text-[#6C47FF]" />
        </div>
        <p className="text-sm font-bold text-[#1A1A2E] animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#EEEEFF] overflow-hidden">
        <Sidebar className="border-r border-[#E8E6FF] bg-white">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#6C47FF]" />
              <span className="text-xl font-headline font-bold">GigShield<span className="text-[#6C47FF] text-xs ml-1">ADMIN</span></span>
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
                <Link href="/admin/support">
                  <SidebarMenuButton>
                    <Headphones className="h-4 w-4" />
                    <span>Support Queue</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-[#E8E6FF]">
            <SidebarMenuButton onClick={handleLogout} className="text-[#EF4444] font-bold">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-[#1A1A2E]">Claim Management</h1>
              <p className="text-[#64748B]">Review and process worker insurance claims</p>
            </div>
          </header>

          {error ? (
            <div className="p-10 text-center border-2 border-dashed border-[#EF4444]/30 rounded-2xl bg-white">
              <p className="text-[#EF4444] font-bold">Failed to load claims. Permission denied.</p>
            </div>
          ) : (
            <section className="rounded-card border border-[#E8E6FF] bg-white shadow-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EEEEFF] font-bold uppercase text-xs tracking-wider text-[#94A3B8] border-b border-[#E8E6FF]">
                  <tr>
                    <th className="p-4">Worker ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Time Slot</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6FF]">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="p-4"><Skeleton className="h-8 w-full" /></td>
                      </tr>
                    ))
                  ) : claims && claims.length > 0 ? (
                    claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-[#EDE9FF]/30 transition-colors">
                        <td className="p-4 font-mono text-[10px] text-[#64748B]">{claim.worker_id || claim.userId}</td>
                        <td className="p-4 font-bold text-[#1A1A2E]">₹{claim.compensation}</td>
                        <td className="p-4 capitalize text-[#64748B]">{claim.dna_time_slot}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={`capitalize font-semibold ${
                            claim.status === 'paid' || claim.status === 'approved' ? 'bg-[#DCFCE7] text-[#22C55E] border-transparent' : 
                            claim.status === 'rejected' ? 'bg-[#FEE2E2] text-[#EF4444] border-transparent' : 
                            'bg-[#FEF3C7] text-[#F59E0B] border-transparent'
                          }`}>
                            {claim.status || 'pending'}
                          </Badge>
                        </td>
                        <td className="p-4 text-[#64748B] text-xs">
                          {claim.created_at?.seconds ? format(new Date(claim.created_at.seconds * 1000), "MMM dd, HH:mm") : "Just now"}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          {(claim.status === 'pending' || !claim.status) && (
                            <>
                              <Button size="icon" variant="ghost" className="text-[#22C55E] hover:bg-[#DCFCE7]" onClick={() => updateStatus(claim.id, 'approved')}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-[#EF4444] hover:bg-[#FEE2E2]" onClick={() => updateStatus(claim.id, 'rejected')}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 font-bold text-[#6C47FF] hover:bg-[#EDE9FF]">Details</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-[#94A3B8] italic">No claims filed yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}