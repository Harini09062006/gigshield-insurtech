/**
 * @fileOverview Feature Builder for AI Pipeline.
 * Aggregates raw data sources into a feature vector.
 */

import { RiskFeatures } from "./riskEngine";

/**
 * Builds a structured feature set for the risk engine.
 * @param user The worker's profile data.
 * @param weather Environmental data for the region.
 * @param claimCount Number of claims in the current period.
 */
export const buildFeatures = (user: any, weather: any, claimCount: number = 0): RiskFeatures => {
  return {
    rainProbability: weather.rainProbability ?? 0,
    temperature: weather.temperature ?? 25,
    pollutionIndex: weather.pollutionIndex ?? 100,
    areaType: (user.city === 'Mumbai' || user.city === 'Chennai') ? 'flood' : 'normal',
    trustScore: user.trustScore ?? 75,
    claimFrequency: claimCount
  };
};
