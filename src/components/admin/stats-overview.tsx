
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, Zap, Activity } from "lucide-react";

export function StatsOverview() {
  const stats = [
    { label: "Total Workers", value: "12,482", icon: Users, color: "text-primary" },
    { label: "Active Policies", value: "8,924", icon: ShieldCheck, color: "text-green-400" },
    { label: "Live Disruptions", value: "14", icon: Zap, color: "text-accent" },
    { label: "Worker Retention", value: "94.2%", icon: Activity, color: "text-purple-400" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">+2.5% from last month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
