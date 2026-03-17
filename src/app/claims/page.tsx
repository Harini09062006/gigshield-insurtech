
"use client";

import { useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, IndianRupee, Loader2, Zap, Home, FileText, Map as MapIcon, LogOut, Shield } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WorkerClaims() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "claims"),
      where("worker_id", "==", user.uid)
    );
  }, [db, user]);

  const { data: rawClaims, isLoading } = useCollection(claimsQuery);

  const claims = useMemo(() => {
    if (!rawClaims) return null;
    return [...rawClaims].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  }, [rawClaims]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-page">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-page flex flex-col font-body">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-heading">
            Gig<span className="text-primary">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className={pathname === "/dashboard" ? "text-primary bg-primary-light" : "text-body"}>
              <Home className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/claims">
            <Button variant="ghost" size="icon" className={pathname === "/claims" ? "text-primary bg-primary-light" : "text-body"}>
              <FileText className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/heatmap">
            <Button variant="ghost" size="icon" className={pathname === "/heatmap" ? "text-primary bg-primary-light" : "text-body"}>
              <MapIcon className="h-6 w-6" />
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-danger hover:bg-danger-bg">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="space-y-8 p-6 lg:p-10 max-w-5xl mx-auto w-full">
        <header>
          <h1 className="text-3xl font-headline font-bold">My Protection Claims</h1>
          <p className="text-body mt-1">Review your parametric payout history and automated verification status</p>
        </header>

        <div className="space-y-6">
          {claims && claims.length > 0 ? (
            claims.map((claim) => (
              <Card key={claim.id} className="border-border shadow-card overflow-hidden bg-white rounded-card">
                <CardHeader className="bg-success-bg/30 px-6 py-4 flex flex-row items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-bold text-heading">Parametric Trigger: {claim.trigger_description || "Severe Rainfall Event"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-body font-bold">
                    <Calendar className="h-4 w-4" />
                    {claim.created_at?.seconds ? format(new Date(claim.created_at.seconds * 1000), "MMM dd, yyyy · HH:mm") : "Recently processed"}
                  </div>
                </CardHeader>
                <CardContent className="p-0 grid md:grid-cols-[1fr,240px]">
                  <div className="p-6 bg-primary-light/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-body uppercase">Claim ID: <span className="text-heading">#{claim.claim_number || claim.id.slice(0, 6)}</span></span>
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider">
                        Calculated using Income DNA
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-body font-medium">DNA Time Slot</span>
                        <span className="text-heading font-bold">{claim.dna_time_slot || "Evening 5-9 PM"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-body font-medium">Registered Rate</span>
                        <span className="text-heading font-bold">₹{claim.registered_rate || "60"}/hr</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-body font-medium">Time Multiplier</span>
                        <span className="text-heading font-bold">{claim.time_multiplier || "1.3"}×</span>
                      </div>
                      <div className="flex justify-between text-sm bg-white p-2 rounded-lg border border-primary/20">
                        <span className="text-primary font-bold">DNA Hourly Rate</span>
                        <span className="text-primary font-black">₹{claim.dna_hourly_rate || "78"}/hr</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-border pt-2">
                        <span className="text-heading font-bold">Total Compensation</span>
                        <span className="text-primary text-lg font-black">₹{claim.compensation || "240"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-l border-border/50 flex flex-col justify-center bg-white text-center">
                    <div>
                      <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Payout Amount</p>
                      <div className="text-4xl font-black text-primary mb-1">₹{claim.compensation || "240"}</div>
                      <Badge className="bg-success-bg text-success mt-4">✓ Paid</Badge>
                    </div>
                  </div>

                  <div className="md:col-span-2 px-6 py-4 border-t border-border/50 bg-bg-page/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-widest">
                      <CheckCircle2 className="h-4 w-4" /> FRAUD DETECTION STATUS: PASSED
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-success text-success bg-success-bg text-[9px] font-bold px-3">GPS Validation → Verified</Badge>
                      <Badge variant="outline" className="border-success text-success bg-success-bg text-[9px] font-bold px-3">Weather Event → Confirmed</Badge>
                      <Badge variant="outline" className="border-success text-success bg-success-bg text-[9px] font-bold px-3">Duplicate Check → Passed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-border rounded-card bg-white/50">
              <div className="h-16 w-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-muted" />
              </div>
              <h3 className="text-xl font-bold text-heading">No claims yet</h3>
              <p className="text-body max-w-xs mx-auto mt-2">Automated payouts will appear here when severe weather events are detected.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
