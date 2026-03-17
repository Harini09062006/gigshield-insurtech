'use server';
/**
 * @fileOverview A Genkit flow for detecting collective work disruptions.
 *
 * - disruptionDetectionFlow - A Genkit flow that analyzes worker location data
 *   to identify clusters of offline workers indicating a collective disruption.
 * - detectDisruptions - A wrapper function to call the disruptionDetectionFlow.
 * - DisruptionDetectionInput - The input type for the disruptionDetectionFlow.
 * - DisruptionDetectionOutput - The return type for the disruptionDetectionFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Helper function to calculate distance between two geographical points using Haversine formula
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

const WorkerLocationSchema = z.object({
  workerId: z.string().describe('Unique identifier for the worker.'),
  latitude: z.number().describe("Worker's latitude."),
  longitude: z.number().describe("Worker's longitude."),
});
export type WorkerLocation = z.infer<typeof WorkerLocationSchema>;


const DisruptionDetectionInputSchema = z.object({
  timestamp: z.string().datetime().describe('Timestamp of the worker data snapshot.'),
  offlineWorkers: z
    .array(WorkerLocationSchema)
    .describe('List of workers currently detected as offline, with their last known locations.'),
});
export type DisruptionDetectionInput = z.infer<typeof DisruptionDetectionInputSchema>;

const DisruptionEventSchema = z.object({
  timestamp: z.string().datetime().describe('Timestamp when the disruption was detected.'),
  latitude: z.number().describe('Latitude of the disruption center.'),
  longitude: z.number().describe('Longitude of the disruption center.'),
  workersCount: z.number().int().describe('Number of offline workers in the disruption cluster.'),
});
export type DisruptionEvent = z.infer<typeof DisruptionEventSchema>;


const DisruptionDetectionOutputSchema = z.object({
  disruptions: z.array(DisruptionEventSchema).describe('List of detected disruption events.'),
});
export type DisruptionDetectionOutput = z.infer<typeof DisruptionDetectionOutputSchema>;

export async function detectDisruptions(
  input: DisruptionDetectionInput
): Promise<DisruptionDetectionOutput> {
  return disruptionDetectionFlow(input);
}

const disruptionDetectionFlow = ai.defineFlow(
  {
    name: 'disruptionDetectionFlow',
    inputSchema: DisruptionDetectionInputSchema,
    outputSchema: DisruptionDetectionOutputSchema,
  },
  async (input) => {
    const { timestamp, offlineWorkers } = input;
    const detectedDisruptions: DisruptionEvent[] = [];
    const clusterRadiusMeters = 2000; // 2km radius
    const minWorkersForDisruption = 10;

    const processedWorkerIds = new Set<string>();
    const allClusters: WorkerLocation[][] = [];

    for (const worker of offlineWorkers) {
      if (processedWorkerIds.has(worker.workerId)) {
        continue;
      }

      const currentCluster: WorkerLocation[] = [];
      const toProcessQueue: WorkerLocation[] = [worker];
      processedWorkerIds.add(worker.workerId);

      let queuePointer = 0;
      while (queuePointer < toProcessQueue.length) {
        const currentWorker = toProcessQueue[queuePointer++];
        currentCluster.push(currentWorker); // Add to the final cluster members

        for (const otherWorker of offlineWorkers) {
          if (!processedWorkerIds.has(otherWorker.workerId)) { // Only consider workers not yet processed
            const distance = haversineDistance(
              currentWorker.latitude,
              currentWorker.longitude,
              otherWorker.latitude,
              otherWorker.longitude
            );

            if (distance <= clusterRadiusMeters) {
              processedWorkerIds.add(otherWorker.workerId);
              toProcessQueue.push(otherWorker); // Add to queue for further processing
            }
          }
        }
      }
      allClusters.push(currentCluster); // This cluster is complete
    }

    // Filter clusters that meet the disruption criteria and calculate centroids
    allClusters.forEach((clusterMembers) => {
      if (clusterMembers.length >= minWorkersForDisruption) {
        let sumLat = 0;
        let sumLon = 0;
        clusterMembers.forEach((member) => {
          sumLat += member.latitude;
          sumLon += member.longitude;
        });

        const centroidLat = sumLat / clusterMembers.length;
        const centroidLon = sumLon / clusterMembers.length;

        detectedDisruptions.push({
          timestamp: timestamp,
          latitude: centroidLat,
          longitude: centroidLon,
          workersCount: clusterMembers.length,
        });
      }
    });

    return { disruptions: detectedDisruptions };
  }
);
