"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { generateIncomeDNA, IncomeDNAOutput } from "@/ai/flows/income-dna-flow";
import { MOCK_WORKER_PROFILE } from "@/lib/mock-data";
import { IncomeDNACharts } from "@/components/dashboard/income-dna-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, TrendingUp, AlertCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { getIncomeDNAInsight } from "@/lib/mockAI";

export default function IncomeDNAPage() {
  const { user } = useUser();
  const [dna, setDna] = useState<IncomeDNAOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDNA = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await generateIncomeDNA({
        workerId: user.uid,
        workEntries: MOCK_WORKER_PROFILE.lastEarningSnapshot
      });
      setDna(result);
    } catch (error) {
      console.error("Failed to generate Income DNA:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDNA();
  }, [user]);

  const insight = dna ? getIncomeDNAInsight(dna) : null;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Income DNA Profile</h1>
          <p className="text-muted-foreground">AI analysis of your earning patterns and risk factors</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDNA} 
          disabled={loading}
          className="border-primary/20 hover:bg-primary/10"
        >
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Analysis
        </Button>
      </header>

      {loading ? (
        <div className="space-y-8">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      ) : dna ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <section className="p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  AI Performance Summary
                </div>
                <h2 className="text-2xl font-headline font-bold">Your Earning Potential</h2>
                <p className="text-foreground/80 leading-relaxed max-w-xl">
                  {insight}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Expected Weekly: ₹{dna.expected_weekly_earnings}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">Active Protection: Verified</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Risk Score</p>
                    <p className="text-2xl font-bold text-primary">24<span className="text-xs font-normal">/100</span></p>
                  </CardContent>
                </Card>
                <Card className="bg-background/40 border-border/50 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Consistency</p>
                    <p className="text-2xl font-bold text-accent">88%</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          </section>

          <IncomeDNACharts data={dna} />

          <section className="grid gap-6 md:grid-cols-3">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Peak Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dna.peak_earning_hours.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                    <span>Window {i + 1}</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{slot}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Strategy Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-4 sm:grid-cols-2">
                  <li className="flex gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">1</div>
                    <p className="text-muted-foreground">Focus your work on <span className="text-foreground font-medium">{dna.high_activity_days.slice(0, 2).join(", ")}</span> for 1.4x better insurance coverage limits.</p>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">2</div>
                    <p className="text-muted-foreground">Minimize downtime during <span className="text-foreground font-medium">{dna.peak_earning_hours[0]}</span> to maintain high consistency scores.</p>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">3</div>
                    <p className="text-muted-foreground">Update your location data daily to ensure the Disruption Engine detects local outages accurately.</p>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">4</div>
                    <p className="text-muted-foreground">Your average hourly rate of ₹{dna.avg_earnings_by_window[0].average_earnings.toFixed(0)} is increasing. Consider the Elite Shield.</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </motion.div>
      ) : (
        <div className="p-12 text-center bg-card/30 border border-dashed border-border/50 rounded-2xl">
          <p className="text-muted-foreground">No data available to generate Income DNA.</p>
          <Button onClick={fetchDNA} className="mt-4">Try Again</Button>
        </div>
      )}
    </div>
  );
}