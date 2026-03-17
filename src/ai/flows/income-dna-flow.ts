'use server';
/**
 * @fileOverview A Genkit flow for generating a worker's Income DNA profile based on their work data.
 *
 * - generateIncomeDNA - A function that analyzes worker data to produce an Income DNA profile.
 * - WorkerWorkDataInput - The input type for the generateIncomeDNA function.
 * - IncomeDNAOutput - The return type for the generateIncomeDNA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const WorkerWorkEntrySchema = z.object({
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the work session start.'),
  hoursWorked: z.number().min(0).describe('Number of hours worked in this session.'),
  earnings: z.number().min(0).describe('Earnings from this work session.'),
  location: z.string().describe('Geographical location during the work session (e.g., "City, State" or "latitude,longitude").')
});

export const WorkerWorkDataInputSchema = z.object({
  workerId: z.string().describe('The unique identifier of the worker.'),
  workEntries: z.array(WorkerWorkEntrySchema).describe('An array of individual work entries, each detailing a work session.')
});
export type WorkerWorkDataInput = z.infer<typeof WorkerWorkDataInputSchema>;

// Output Schema
export const IncomeDNAOutputSchema = z.object({
  worker_id: z.string().describe('The ID of the worker.'),
  peak_earning_hours: z.array(z.string()).describe('A list of time windows (e.g., "17:00-19:00") when the worker typically earns the most.'),
  high_activity_days: z.array(z.string()).describe('A list of days of the week (e.g., "Monday", "Friday") when the worker is most active or earns most.'),
  avg_earnings_by_window: z.array(z.object({
    time_window: z.string().describe('Time window (e.g., "09:00-12:00")'),
    average_earnings: z.number().describe('Average earnings in this time window.')
  })).describe('Average earnings grouped by specific time windows throughout the day.'),
  expected_weekly_earnings: z.number().describe('The estimated total earnings the worker can expect in a typical week, based on the provided data.')
});
export type IncomeDNAOutput = z.infer<typeof IncomeDNAOutputSchema>;

// Wrapper function to call the flow
export async function generateIncomeDNA(input: WorkerWorkDataInput): Promise<IncomeDNAOutput> {
  return incomeDNAFlow(input);
}

// Genkit Prompt
const incomeDNAPrompt = ai.definePrompt({
  name: 'incomeDNAPrompt',
  input: { schema: WorkerWorkDataInputSchema },
  output: { schema: IncomeDNAOutputSchema },
  prompt: `You are an expert income profiler. Your task is to analyze the provided worker's raw work data and generate a detailed "Income DNA" profile.\n  \n  Based on the following work entries for worker ID: "{{{workerId}}}", identify and summarize the following:\n  \n  1.  **Peak Earning Hours**: Determine the typical time windows during the day when the worker earns the most. Provide these as a list of time ranges (e.g., "17:00-19:00").\n  2.  **High Activity Days**: Identify the days of the week (e.g., "Monday", "Friday") when the worker is most active or generates the highest earnings.\n  3.  **Average Earnings by Time Window**: Group the earnings into sensible time windows throughout the day (e.g., "00:00-03:00", "03:00-06:00", "06:00-09:00", etc.) and calculate the average earnings for each of these windows. Provide an array of objects with 'time_window' and 'average_earnings'.\n  4.  **Expected Weekly Earnings**: Estimate the total earnings the worker can expect in a typical week, based on the provided historical data.\n  \n  Please provide your analysis strictly in the following JSON format. Ensure all fields are populated according to their descriptions.\n  \n  Raw Work Data:\n  {{#each workEntries}}\n  - Timestamp: {{{timestamp}}}, Hours Worked: {{{hoursWorked}}}, Earnings: {{{earnings}}}, Location: {{{location}}}\n  {{/each}}\n  `
});

// Genkit Flow
const incomeDNAFlow = ai.defineFlow(
  {
    name: 'incomeDNAFlow',
    inputSchema: WorkerWorkDataInputSchema,
    outputSchema: IncomeDNAOutputSchema,
  },
  async (input) => {
    const { output } = await incomeDNAPrompt(input);
    if (!output) {
      throw new Error('Failed to generate Income DNA profile: no output received.');
    }
    return output;
  }
);
