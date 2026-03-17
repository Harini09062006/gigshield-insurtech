
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { recommendPlan, PlanRecommendationOutput } from "@/ai/flows/plan-recommendation-flow";
import { IncomeDNAOutput } from "@/ai/flows/income-dna-flow";
import { INSURANCE_PLANS } from "@/lib/mock-data";

interface PlanRecommendationProps {
  incomeDNA: IncomeDNAOutput;
}

export function PlanRecommendation({ incomeDNA }: PlanRecommendationProps) {
  const [recommendation, setRecommendation] = useState<PlanRecommendationOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const getRecommendation = async () => {
    setLoading(true);
    try {
      const avgEarningsMap: Record<string, number> = {};
      incomeDNA.avg_earnings_by_window.forEach(item => {
        avgEarningsMap[item.time_window] = item.average_earnings;
      });

      const result = await recommendPlan({
        expectedWeeklyEarnings: incomeDNA.expected_weekly_earnings,
        peakEarningHours: incomeDNA.peak_earning_hours.join(", "),
        highActivityDays: incomeDNA.high_activity_days,
        avgEarningsByWindow: avgEarningsMap,
        currentPlanName: "Pro Shield",
        availablePlans: INSURANCE_PLANS.map(p => ({
          name: p.name,
          costPerWeek: p.costPerWeek,
          maxPayout: p.maxPayout
        }))
      });
      setRecommendation(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecommendation();
  }, []);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          AI Plan Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing your Income DNA...</p>
          </div>
        ) : recommendation ? (
          <div className="space-y-4">
            <div className="p-4 bg-background/50 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase mb-1">Recommended Plan</p>
              <p className="text-xl font-bold text-primary">{recommendation.recommendedPlanName}</p>
              <p className="text-sm mt-2 text-foreground/80 leading-relaxed">{recommendation.rationale}</p>
            </div>
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
              <p className="text-xs text-accent uppercase mb-1">Strategic Advice</p>
              <p className="text-sm text-foreground/80">{recommendation.suggestion}</p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Upgrade to {recommendation.recommendedPlanName}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={getRecommendation} variant="outline" className="w-full">
            Generate Recommendation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
