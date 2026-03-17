
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { IncomeDNAOutput } from "@/ai/flows/income-dna-flow";

interface IncomeDNAChartsProps {
  data: IncomeDNAOutput;
}

export function IncomeDNACharts({ data }: IncomeDNAChartsProps) {
  const chartData = data.avg_earnings_by_window.map(item => ({
    time: item.time_window,
    earnings: item.average_earnings
  }));

  const COLORS = ['#61A0E6', '#26B3D9', '#61A0E6', '#26B3D9', '#61A0E6', '#26B3D9'];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-headline">Earnings by Time Window</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <RechartsTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-headline">Income DNA Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Expected Weekly</p>
              <p className="text-2xl font-bold text-primary">₹{data.expected_weekly_earnings}</p>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground uppercase mb-1">Peak Hours</p>
              <div className="flex flex-wrap gap-1">
                {data.peak_earning_hours.map(h => (
                  <span key={h} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{h}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">High Activity Days</p>
            <div className="flex gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const isActive = data.high_activity_days.some(d => d.startsWith(day));
                return (
                  <div key={day} className={`flex-1 h-12 flex items-center justify-center rounded-md border ${isActive ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/20 border-border/50 text-muted-foreground'}`}>
                    <span className="text-xs font-bold">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
