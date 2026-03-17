"use client";

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Zap, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function WorkerClaims() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [timeSlot, setTimeSlot] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimatedPayout, setEstimatedPayout] = useState(0);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // We strictly filter by userId to satisfy Firestore Security Rules for 'list'
    return query(
      collection(db, "claims"),
      where("userId", "==", user.uid)
    );
  }, [db, user]);

  const { data: rawClaims, isLoading: isClaimsLoading } = useCollection(claimsQuery);

  // Sort claims in memory to provide the expected UI without requiring complex composite indexes immediately
  const claims = useMemo(() => {
    if (!rawClaims) return null;
    return [...rawClaims].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [rawClaims]);

  const calculateEstimate = (slot: string) => {
    const rates: Record<string, number> = {
      morning: 450,
      afternoon: 350,
      evening: 600,
      night: 400
    };
    setEstimatedPayout(rates[slot] || 0);
  };

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !timeSlot) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "claims"), {
        userId: user.uid,
        time_slot: timeSlot,
        description,
        claim_amount: estimatedPayout,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Claim Filed Successfully",
        description: "AI is reviewing your disruption report.",
      });
      setTimeSlot("");
      setDescription("");
      setEstimatedPayout(0);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error filing claim",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-headline font-bold">My Protection Claims</h1>
        <p className="text-muted-foreground">Report disruptions and receive instant compensation</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                File New Claim
              </CardTitle>
              <CardDescription>Select the time window when your earnings were disrupted</CardDescription>
            </CardHeader>
            <form onSubmit={handleFileClaim}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Disruption Time Slot</Label>
                  <Select 
                    value={timeSlot} 
                    onValueChange={(val) => {
                      setTimeSlot(val);
                      calculateEstimate(val);
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (06:00 - 12:00)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12:00 - 18:00)</SelectItem>
                      <SelectItem value="evening">Evening (18:00 - 00:00)</SelectItem>
                      <SelectItem value="night">Night (00:00 - 06:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description of Disruption</Label>
                  <Textarea 
                    placeholder="E.g. Network outage in Lower Parel area, app inaccessible for 3 hours."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                {estimatedPayout > 0 && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Estimated Payout</span>
                    </div>
                    <span className="text-xl font-bold text-primary">₹{estimatedPayout}</span>
                  </div>
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Button className="w-full font-bold h-12" type="submit" disabled={loading || !timeSlot}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
                  File Instant Claim
                </Button>
              </CardContent>
            </form>
          </Card>

          <Card className="bg-muted/10 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                How Claims Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                AI verifies collective disruption patterns in your reported area.
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Payouts are calculated based on your unique Income DNA hourly rate.
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Approved funds are instantly credited to your linked payout wallet.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-bold">Claim History</h2>
          </div>
          
          <div className="space-y-4">
            {isClaimsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse bg-card/30 h-24" />
              ))
            ) : claims && claims.length > 0 ? (
              claims.map((claim) => (
                <Card key={claim.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        claim.status === 'approved' ? "bg-green-400/10 text-green-400" :
                        claim.status === 'pending' ? "bg-amber-400/10 text-amber-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">₹{claim.claim_amount}</p>
                          <Badge variant="outline" className="capitalize text-[10px] h-4">
                            {claim.time_slot}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {claim.createdAt?.seconds ? format(new Date(claim.createdAt.seconds * 1000), "MMM dd, HH:mm") : "Recently filed"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={claim.status === 'approved' ? "default" : "outline"} className={
                      claim.status === 'approved' ? "bg-green-500 hover:bg-green-500" :
                      claim.status === 'pending' ? "text-amber-400 border-amber-400/30" :
                      ""
                    }>
                      {claim.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border/50">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">You haven't filed any claims yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}