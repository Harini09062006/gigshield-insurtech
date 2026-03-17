"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit, where } from "firebase/firestore";
import { Shield, Zap, TrendingUp, AlertCircle, ChevronRight, FileText, Map as MapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkerOverview() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "userProfiles", user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "claims"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [db, user]);

  const { data: claims, isLoading: isClaimsLoading } = useCollection(claimsQuery);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Good morning, {profile?.name?.split(' ')[0] || 'Worker'}</h1>
          <p className="text-muted-foreground">Your GigShield protection status: <span className="text-primary font-bold">Active</span></p>
        </div>
        <Link href="/worker/claims">
          <Button className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
            File New Claim <Zap className="ml-2 h-4 w-4 fill-current" />
          </Button>
        </Link>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹4,250</div>
              <p className="text-xs text-green-400 mt-1">+12% from last week</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Plan</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Pro Shield</div>
              <p className="text-xs text-muted-foreground mt-1">₹25 / week premium</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Claims</CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{claims?.filter(c => c.status === 'pending').length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Status: Pending Review</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risk Score</CardTitle>
              <AlertCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24 <span className="text-xs font-normal text-muted-foreground">/ 100</span></div>
              <Badge className="mt-1 bg-green-400/10 text-green-400 border-green-400/20">Low Risk</Badge>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-bold">Recent Claims</h2>
            <Link href="/worker/claims" className="text-sm text-primary flex items-center hover:underline">
              View All History <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-bold uppercase text-xs border-b border-border/50">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Slot</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isClaimsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="p-4"><Skeleton className="h-8 w-full" /></td>
                    </tr>
                  ))
                ) : claims && claims.length > 0 ? (
                  claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-muted-foreground">{format(new Date(claim.createdAt?.seconds * 1000 || Date.now()), "MMM dd, yyyy")}</td>
                      <td className="p-4 capitalize">{claim.time_slot}</td>
                      <td className="p-4 font-bold">₹{claim.claim_amount}</td>
                      <td className="p-4 text-right">
                        <Badge variant="outline" className={
                          claim.status === 'approved' ? "bg-green-400/10 text-green-400 border-green-400/20" :
                          claim.status === 'pending' ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
                          "bg-muted text-muted-foreground"
                        }>
                          {claim.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No claims filed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                AI Strategy Box
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                Your Income DNA shows high performance in the <strong>Mumbai West</strong> zone during <strong>evening slots</strong>. 
                Maintain this consistency to lower your risk score further.
              </p>
              <Link href="/worker/income-dna">
                <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10">
                  Update Income DNA
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Live Disruption Map</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-border/50 relative overflow-hidden group cursor-pointer">
                <MapIcon className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground">3 clusters detected in Mumbai Central. High earning zones active in Navi Mumbai.</p>
              <Link href="/heatmap">
                <Button variant="link" className="p-0 h-auto text-primary font-bold">Open Global Heatmap →</Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}