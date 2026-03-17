
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Zap } from "lucide-react";
import { MOCK_DISRUPTION_EVENTS } from "@/lib/mock-data";

export function DisruptionAlerts() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-headline flex items-center gap-2">
        <Zap className="h-5 w-5 text-accent" />
        Live Disruption Alerts
      </h3>
      {MOCK_DISRUPTION_EVENTS.slice(0, 2).map((event, idx) => (
        <Alert key={event.id} variant={idx === 0 ? "destructive" : "default"} className="bg-card/40 backdrop-blur-md">
          {idx === 0 ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          <AlertTitle className="font-bold">
            {idx === 0 ? "Critical Cluster Detected" : "Moderate Activity Change"}
          </AlertTitle>
          <AlertDescription className="text-sm">
            {event.workersCount} workers currently offline near {event.locationName}. 
            Impact on hourly earnings estimated at 15-20%. Consider switching zones.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
