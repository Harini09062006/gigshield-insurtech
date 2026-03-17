
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, RefreshCcw, IndianRupee } from "lucide-react";
import { InsurancePlan, INSURANCE_PLANS } from "@/lib/mock-data";
import { format, addDays } from "date-fns";

interface PolicyCardProps {
  planId: string;
  week: number;
  startDate: string;
  autoRenew: boolean;
}

export function PolicyCard({ planId, week, startDate, autoRenew }: PolicyCardProps) {
  const plan = INSURANCE_PLANS.find(p => p.id === planId) || INSURANCE_PLANS[0];
  const nextRenewalDate = addDays(new Date(startDate), week * 7);

  return (
    <Card className="overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm">
      <div className="h-1 bg-primary w-full" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {plan.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Active Protection Policy</p>
        </div>
        <Badge variant={autoRenew ? "default" : "outline"} className="flex gap-1">
          <RefreshCcw className="h-3 w-3" />
          {autoRenew ? "Auto-Renew ON" : "Auto-Renew OFF"}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-md">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Week Status</p>
              <p className="text-sm font-semibold">Week {week} of 4</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-md">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Next Renewal</p>
              <p className="text-sm font-semibold">{format(nextRenewalDate, "MMM dd, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-md">
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Renewal Amount</p>
              <p className="text-sm font-semibold">₹{plan.costPerWeek}/week</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-md">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Payout</p>
              <p className="text-sm font-semibold">₹{plan.maxPayout}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
