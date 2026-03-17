"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Zap, Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export function DisruptionAlerts() {
  const db = useFirestore();
  
  const disruptionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "disruptionEvents"),
      orderBy("timestamp", "desc"),
      limit(3)
    );
  }, [db]);

  const { data: disruptions, isLoading } = useCollection(disruptionsQuery);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-headline flex items-center gap-2">
        <Zap className="h-5 w-5 text-accent" />
        Live Disruption Alerts
      </h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8 bg-card/20 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : disruptions && disruptions.length > 0 ? (
        disruptions.map((event, idx) => (
          <Alert key={event.id} variant={idx === 0 ? "destructive" : "default"} className="bg-card/40 backdrop-blur-md">
            {idx === 0 ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            <AlertTitle className="font-bold">
              {idx === 0 ? "Critical Cluster Detected" : "Moderate Activity Change"}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {event.workersAffectedCount} workers currently offline. 
              {event.aiSuggestion || `Impact detected near coordinate ${event.latitude.toFixed(2)}, ${event.longitude.toFixed(2)}. Consider switching zones.`}
            </AlertDescription>
          </Alert>
        ))
      ) : (
        <div className="p-4 bg-muted/20 border border-border/50 rounded-lg text-center text-sm text-muted-foreground">
          No active disruptions detected in your area.
        </div>
      )}
    </div>
  );
}
