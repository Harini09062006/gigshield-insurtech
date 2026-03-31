/**
 * @fileOverview AI Risk Engine for GigShield.
 * Calculates a numerical risk score based on multi-factor feature inputs.
 */

export interface RiskFeatures {
  rainProbability: number;
  temperature: number;
  areaType: "flood" | "normal";
  trustScore: number;
  pollutionIndex?: number;
  claimFrequency?: number;
}

/**
 * Computes a risk score from 0 to 100 based on environmental and behavioral features.
 * @param features The synthesized feature vector.
 */
export const computeRiskScore = (features: RiskFeatures): number => {
  let score = 0;

  // 1. Weather Risk (Max 30)
  score += (features.rainProbability / 100) * 30;
  
  // 2. Temperature Risk (Max 10)
  score += (features.temperature > 35 ? 10 : 0);

  // 3. Location Risk (Max 20)
  if (features.areaType === "flood") score += 20;

  // 4. Behavioral Risk (Max 20)
  if (features.trustScore < 50) score += 20;

  // 5. Environmental Risk (Max 20)
  if (features.pollutionIndex && features.pollutionIndex > 150) score += 10;
  if (features.claimFrequency && features.claimFrequency > 3) score += 10;

  return Math.min(Math.round(score), 100);
};
