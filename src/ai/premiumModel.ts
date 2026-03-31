/**
 * @fileOverview AI Premium Prediction Model.
 * Translates risk scores into dynamic pricing decisions.
 */

/**
 * Predicts the optimal weekly premium based on the computed risk score.
 * Uses non-linear pricing to account for high-risk tails.
 * @param riskScore Calculated risk from the engine (0-100).
 */
export const predictPremium = (riskScore: number): number => {
  const base = 30;

  // Non-linear pricing steps
  if (riskScore < 20) return base - 5;  // Low risk discount
  if (riskScore < 40) return base;      // Standard rate
  if (riskScore < 60) return base + 10; // Moderate risk surcharge
  if (riskScore < 80) return base + 20; // High risk surcharge

  return base + 30; // Critical risk protection
};
