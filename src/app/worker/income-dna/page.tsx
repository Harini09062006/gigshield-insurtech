"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { generateIncomeDNA, IncomeDNAOutput } from "@/ai/flows/income-dna-flow";
import { IncomeDNACharts } from "@/components/dashboard/income-dna-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, RefreshCw, TrendingUp, ShieldCheck, Save, Loader2, Plus, Trash2 } from "lucide-react";
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

  // Work Entry Form State
  const [entries, setEntries] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    hoursWorked: 4,
    earnings: 500,
    location: "Mumbai, MH"
  });

  useEffect(() => {
    if (existingDna) {
      setDna(existingDna as unknown as IncomeDNAOutput);
    }
  }, [existingDna]);

  const addEntry = () => {
    setEntries(prev => [...prev, { ...newEntry, timestamp: new Date(newEntry.timestamp).toISOString() }]);
    toast({ title: "Entry Added", description: "Added to temporary analysis list." });
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    if (!user) return;
    if (entries.length < 3) {
      toast({ variant: "destructive", title: "Insufficient Data", description: "Add at least 3 work entries for a valid DNA analysis." });
      return;
    }

    setLoading(true);
    try {
      const result = await generateIncomeDNA({
        workerId: user.uid,
        workEntries: entries
      });
      setDna(result);
      toast({ title: "Analysis Complete", description: "Your Income DNA has been updated." });
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
      toast({ title: "DNA Profile Saved", description: "Your earning patterns are now synchronized." });
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
          {dna && (
            <Button onClick={saveToProfile} disabled={saving} className="bg-primary">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-1 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add Work Data
              </CardTitle>
              <CardDescription>Enter your recent earning sessions to train the AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input 
                  type="datetime-local" 
                  value={newEntry.timestamp}
                  onChange={e => setNewEntry(prev => ({ ...prev, timestamp: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hours Worked</Label>
                  <Input 
                    type="number" 
                    value={newEntry.hoursWorked}
                    onChange={e => setNewEntry(prev => ({ ...prev, hoursWorked: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Earnings (₹)</Label>
                  <Input 
                    type="number" 
                    value={newEntry.earnings}
                    onChange={e => setNewEntry(prev => ({ ...prev, earnings: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input 
                  value={newEntry.location}
                  onChange={e => setNewEntry(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <Button variant="outline" className="w-full" onClick={addEntry}>
                Add Entry
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/50 max-h-[400px] overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Pending Analysis ({entries.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entries.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-10">No entries added yet.</p>
              ) : (
                entries.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded-md border border-border/30 text-xs">
                    <div>
                      <p className="font-bold">₹{e.earnings} • {e.hoursWorked}h</p>
                      <p className="text-muted-foreground text-[10px]">{new Date(e.timestamp).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeEntry(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
            {entries.length > 0 && (
              <CardContent className="pt-0">
                <Button className="w-full bg-primary" onClick={runAnalysis} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Run AI Analysis
                </Button>
              </CardContent>
            )}
          </Card>
        </section>

        <section className="lg:col-span-2 space-y-8">
          {isDnaLoading || loading ? (
            <div className="space-y-8">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-[250px] w-full rounded-xl" />
              </div>
            </div>
          ) : dna ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <section className="p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl border border-primary/20 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      AI DNA Summary
                    </div>
                    <h2 className="text-2xl font-headline font-bold">Your Earning DNA</h2>
                    <p className="text-foreground/80 leading-relaxed max-w-xl">{insight}</p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Expected Weekly: ₹{dna.expected_weekly_earnings}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium">Protection Status: Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <IncomeDNACharts data={dna} />
            </motion.div>
          ) : (
            <div className="p-12 text-center bg-card/30 border border-dashed border-border/50 rounded-2xl h-[400px] flex flex-col items-center justify-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">Add work entries on the left and run AI analysis to generate your DNA profile.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}