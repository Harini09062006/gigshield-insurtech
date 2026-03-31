/**
 * @fileOverview AI Risk Engine for GigShield.
 * Calculates a numerical risk score based on multi-factor feature inputs.
 */

export interface RiskFeatures {
  rainProbability: number;
  temperature: number;
  pollutionIndex: number;
  areaType: "flood" | "normal";
  trustScore: number;
  claimFrequency: number;
}

/**
 * Computes a risk score from 0 to 100 based on environmental and behavioral features.
 * @param features The synthesized feature vector.
 */
export const computeRiskScore = (features: RiskFeatures): number => {
  let score = 0;

  // 1. Weather Risk (Max 35)
  score += (features.rainProbability / 100) * 25;
  score += (features.temperature > 35 ? 10 : 0);

  // 2. Location Risk (Max 20)
  if (features.areaType === "flood") score += 20;
  else score += 5;

  // 3. Behavioral Risk (Max 35)
  // Penalize high frequency and low trust
  if (features.claimFrequency > 3) score += 15;
  if (features.trustScore < 50) score += 20;

  // 4. Environmental Risk (Max 10)
  if (features.pollutionIndex > 150) score += 10;

  return Math.min(Math.round(score), 100);
};
