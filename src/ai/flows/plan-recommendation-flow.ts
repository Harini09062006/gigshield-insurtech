'use server';
/**
 * @fileOverview This file implements a Genkit flow for recommending insurance plans based on a worker's income DNA profile.
 *
 * - recommendPlan - An asynchronous function to recommend an insurance plan.
 * - PlanRecommendationInput - The input type for the recommendPlan function.
 * - PlanRecommendationOutput - The return type for the recommendPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PlanRecommendationInputSchema = z.object({
  expectedWeeklyEarnings: z.number().describe('The worker\'s expected weekly earnings.'),
  peakEarningHours: z.string().describe('The typical peak earning hours for the worker (e.g., "Mornings (8-11 AM)").'),
  highActivityDays: z.array(z.string()).describe('An array of days with high work activity (e.g., ["Monday", "Friday"]).'),
  avgEarningsByWindow: z.record(z.string(), z.number()).describe('An object showing average earnings by time window (e.g., {"0-3": 100, "3-6": 150}).'),
  currentPlanName: z.string().optional().describe('The name of the worker\'s current insurance plan, if any.'),
  availablePlans: z.array(
    z.object({
      name: z.string().describe('The name of the insurance plan (e.g., "Basic Shield").'),
      costPerWeek: z.number().describe('The weekly cost of the plan in local currency.'),
      maxPayout: z.number().describe('The maximum payout limit of the plan in local currency.'),
    })
  ).describe('An array of all available insurance plans with their details.'),
});
export type PlanRecommendationInput = z.infer<typeof PlanRecommendationInputSchema>;

const PlanRecommendationOutputSchema = z.object({
  recommendedPlanName: z.string().describe('The name of the recommended insurance plan (e.g., "Pro Shield").'),
  rationale: z.string().describe('A detailed explanation for why this plan is recommended.'),
  suggestion: z.string().describe('Additional advice or considerations for the worker.'),
});
export type PlanRecommendationOutput = z.infer<typeof PlanRecommendationOutputSchema>;

export async function recommendPlan(input: PlanRecommendationInput): Promise<PlanRecommendationOutput> {
  return planRecommendationFlow(input);
}

const planRecommendationPrompt = ai.definePrompt({
  name: 'planRecommendationPrompt',
  input: { schema: PlanRecommendationInputSchema },
  output: { schema: PlanRecommendationOutputSchema },
  prompt: `You are an expert financial advisor specializing in income protection for gig workers.
Your goal is to recommend the most suitable insurance plan based on the worker's income profile and available plans, ensuring adequate protection without over-insuring.

Here is the worker's income DNA profile:
- Expected Weekly Earnings: ₹{{{expectedWeeklyEarnings}}}
- Peak Earning Hours: {{{peakEarningHours}}}
- High Activity Days: {{#each highActivityDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Average Earnings by Time Window: {{json avgEarningsByWindow}}
{{#if currentPlanName}}- Current Plan: {{{currentPlanName}}}{{/if}}

Available Insurance Plans:
{{#each availablePlans}}
- {{name}}: Cost ₹{{costPerWeek}}/week, Max Payout ₹{{maxPayout}}
{{/each}}

Based on this information, recommend one of the available plans. Provide a clear rationale for your recommendation, considering the worker's expected earnings, and suggest any additional considerations.

Your recommendation should be practical and aim to balance cost with adequate coverage. If the worker's expected earnings are significantly higher than the max payout of even the Elite Shield, acknowledge this and suggest external advice.

Always recommend a plan. Do not suggest 'no plan'.
`,
});

const planRecommendationFlow = ai.defineFlow(
  {
    name: 'planRecommendationFlow',
    inputSchema: PlanRecommendationInputSchema,
    outputSchema: PlanRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await planRecommendationPrompt(input);
    return output!;
  }
);
