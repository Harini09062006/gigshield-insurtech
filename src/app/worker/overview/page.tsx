"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, limit, where } from "firebase/firestore";
import { Shield, Zap, TrendingUp, AlertCircle, ChevronRight, FileText, Map as MapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export default function WorkerOverview() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "userProfiles", user.uid);
  }, [db, user]);

  const dnaRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "income_dna", user.uid);
  }, [db, user]);

  const userPlanRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "user_plans", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(profileRef);
  const { data: dna, isLoading: isDnaLoading } = useDoc(dnaRef);
  const { data: activePlan, isLoading: isPlanLoading } = useDoc(userPlanRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "claims"),
      where("userId", "==", user.uid),
      limit(5)
    );
  }, [db, user]);

  const { data: rawClaims, isLoading: isClaimsLoading } = useCollection(claimsQuery);

  const claims = useMemo(() => {
    if (!rawClaims) return null;
    return [...rawClaims].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [rawClaims]);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-8 pb-10 bg-bg-page min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 lg:p-10">
        <div>
          <h1 className="text-3xl font-headline font-bold text-heading">Good morning, {profile?.name?.split(' ')[0] || 'Worker'}</h1>
          <p className="text-body">Your GigShield protection status: <span className="text-primary font-bold">{activePlan ? 'Active' : 'No Active Plan'}</span></p>
        </div>
        <Link href="/worker/claims">
          <Button className="bg-primary hover:bg-primary-hover text-white font-bold shadow-btn rounded-btn">
            File New Claim <Zap className="ml-2 h-4 w-4 fill-current" />
          </Button>
        </Link>
      </header>

      <div className="px-6 lg:px-10 space-y-8">
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={item}>
            <Card className="bg-white border-border shadow-card rounded-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted uppercase tracking-wider">Expected Weekly</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-heading">₹{dna?.expected_weekly_earnings || "0"}</div>
                <p className="text-xs text-success mt-1">Based on DNA profile</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={item}>
            <Card className="bg-primary text-white border-primary shadow-card rounded-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Active Plan</CardTitle>
                <Shield className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePlan?.planName || "None"}</div>
                <p className="text-xs opacity-80 mt-1">{activePlan ? `₹${activePlan.weekly_premium} / week` : 'Select a plan to start'}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-white border-border shadow-card rounded-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted uppercase tracking-wider">Open Claims</CardTitle>
                <FileText className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-heading">{claims?.filter(c => c.status === 'pending').length || 0}</div>
                <p className="text-xs text-body mt-1">Status: Pending Review</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-white border-border shadow-card rounded-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted uppercase tracking-wider">Risk Score</CardTitle>
                <AlertCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-heading">24 <span className="text-xs font-normal text-muted">/ 100</span></div>
                <Badge className="mt-1 bg-success-bg text-success border-transparent font-semibold">LOW RISK</Badge>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold text-heading">Recent Claims</h2>
              <Link href="/worker/claims" className="text-sm text-primary flex items-center hover:underline font-bold">
                View All History <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-card border border-border bg-white shadow-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-page font-bold uppercase text-xs text-muted border-b border-border">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Slot</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isClaimsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={3} className="p-4"><Skeleton className="h-8 w-full" /></td>
                      </tr>
                    ))
                  ) : claims && claims.length > 0 ? (
                    claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-primary-light transition-colors">
                        <td className="p-4 text-body font-medium">{claim.createdAt?.seconds ? format(new Date(claim.createdAt.seconds * 1000), "MMM dd, yyyy") : 'Recent'}</td>
                        <td className="p-4 capitalize text-heading font-semibold">{claim.time_slot}</td>
                        <td className="p-4 text-right">
                          <Badge variant="outline" className={
                            claim.status === 'approved' ? "bg-success-bg text-success border-transparent" : 
                            claim.status === 'pending' ? "bg-warning-bg text-warning border-transparent" :
                            "bg-danger-bg text-danger border-transparent"
                          }>
                            {claim.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-muted italic">No claims filed yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <Card className="bg-primary-light border-border shadow-card rounded-card">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-heading">
                  <Zap className="h-5 w-5 text-primary" />
                  AI Strategy Box
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-body leading-relaxed">
                  {isDnaLoading ? "Analyzing DNA..." : dna ? `Your Income DNA shows high performance in ${dna.high_activity_days[0]}. Maintain this consistency.` : "Run your first DNA analysis to get personalized strategy."}
                </p>
                <Link href="/worker/income-dna">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-white rounded-btn font-bold">
                    Update Income DNA
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-bg-card-yellow border-warning-bg shadow-card rounded-card">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-heading">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Weather Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <p className="text-sm text-body">Low probability of heavy rainfall in your sector today.</p>
                 <Badge className="bg-warning-bg text-warning border-transparent">MEDIUM CAUTION</Badge>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}