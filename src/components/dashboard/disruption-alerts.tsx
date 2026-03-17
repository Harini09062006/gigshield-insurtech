
"use client";

import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Zap, Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, where } from "firebase/firestore";

export function DisruptionAlerts() {
  const db = useFirestore();
  
  const disruptionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "disruption_zones"),
      where("risk_level", "in", ["extreme", "high"]),
      limit(3)
    );
  }, [db]);

  const { data: rawDisruptions, isLoading } = useCollection(disruptionsQuery);

  const disruptions = useMemo(() => {
    if (!rawDisruptions) return null;
    return [...rawDisruptions].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
  }, [rawDisruptions]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-headline font-bold flex items-center gap-2 text-heading">
        <Zap className="h-5 w-5 text-primary" />
        Live Disruption Alerts
      </h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8 bg-white rounded-card border border-border">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : disruptions && disruptions.length > 0 ? (
        disruptions.map((event, idx) => (
          <Alert key={event.id} variant={idx === 0 ? "destructive" : "default"} className="bg-white border-border shadow-card">
            {event.risk_level === 'extreme' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            <AlertTitle className="font-bold text-heading">
              {event.risk_level === 'extreme' ? "Extreme Danger Zone" : "High Activity Change"}
            </AlertTitle>
            <AlertDescription className="text-sm text-body">
              Zone: <b>{event.zone_name || event.zone}</b>. 
              {event.reason || "Avoid this area for delivery. High potential for income disruption."}
            </AlertDescription>
          </Alert>
        ))
      ) : (
        <div className="p-4 bg-white border border-border rounded-card text-center text-sm text-body">
          No active critical disruptions in your city.
        </div>
      )}
    </div>
  );
}
