
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { generateIncomeDNA, IncomeDNAOutput } from "@/ai/flows/income-dna-flow";
import { MOCK_WORKER_PROFILE } from "@/lib/mock-data";
import { IncomeDNACharts } from "@/components/dashboard/income-dna-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, TrendingUp, AlertCircle, ShieldCheck, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getIncomeDNAInsight } from "@/lib/mockAI";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function IncomeDNAPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const dnaRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "income_dna", user.uid);
  }, [db, user]);

  const { data: existingDna, isLoading: isDnaLoading } = useDoc(dnaRef);

  const [dna, setDna] = useState<IncomeDNAOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingDna) {
      setDna(existingDna as unknown as IncomeDNAOutput);
    }
  }, [existingDna]);

  const runAnalysis = async () => {
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
      toast({ variant: "destructive", title: "Analysis Failed", description: "Could not generate DNA profile." });
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async () => {
    if (!user || !dna || !db) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "income_dna", user.uid), {
        ...dna,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
      toast({ title: "DNA Profile Saved", description: "Your earning patterns have been updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const insight = dna ? getIncomeDNAInsight(dna) : null;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Income DNA Profile</h1>
          <p className="text-muted-foreground">AI analysis of your earning patterns and risk factors</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={runAnalysis} 
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Run AI Analysis
          </Button>
          {dna && (
            <Button onClick={saveToProfile} disabled={saving} className="bg-primary">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          )}
        </div>
      </header>

      {isDnaLoading || loading ? (
        <div className="space-y-8">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      ) : dna ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <section className="p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  AI Performance Summary
                </div>
                <h2 className="text-2xl font-headline font-bold">Your Earning Potential</h2>
                <p className="text-foreground/80 leading-relaxed max-w-xl">{insight}</p>
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
          </section>

          <IncomeDNACharts data={dna} />
        </motion.div>
      ) : (
        <div className="p-12 text-center bg-card/30 border border-dashed border-border/50 rounded-2xl">
          <p className="text-muted-foreground">Run an AI analysis to see your earning DNA.</p>
          <Button onClick={runAnalysis} className="mt-4">Generate DNA Now</Button>
        </div>
      )}
    </div>
  );
}
