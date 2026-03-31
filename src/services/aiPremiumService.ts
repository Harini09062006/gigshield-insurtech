/**
 * @fileOverview AI Premium Orchestration Service.
 * Manages the data flow between weather APIs and the ML models.
 */

import { buildFeatures } from "@/ai/featureBuilder";
import { computeRiskScore } from "@/ai/riskEngine";
import { Firestore, collection, query, where, getDocs } from "firebase/firestore";

/**
 * DNA-based premium calculation.
 * Formula: (weeklyIncome * riskScore) / 1000, clamped between 20 and 80.
 */
export const calculateDNAPremium = (weeklyIncome: number, riskScore: number): number => {
  let premium = (weeklyIncome * riskScore) / 1000;
  if (premium < 20) premium = 20;
  if (premium > 80) premium = 80;
  return Math.round(premium);
};

/**
 * Calculates potential income loss based on risk probability.
 */
export const calculateIncomeLoss = (weeklyIncome: number, riskScore: number): number => {
  return Math.round(weeklyIncome * (riskScore / 100));
};

/**
 * Returns fixed coverage limits per plan.
 */
export const getCoverageAmount = (plan: string): number => {
  if (plan === "basic") return 60;
  if (plan === "pro") return 240;
  if (plan === "elite") return 600;
  return 240;
};

/**
 * Calculates financial gap between loss and coverage.
 */
export const calculateRemainingRisk = (incomeLoss: number, coverage: number): number => {
  const remaining = incomeLoss - coverage;
  return remaining > 0 ? remaining : 0;
};

/**
 * Calculates a dynamic premium based on the selected plan and AI risk score.
 * (Legacy method kept for compatibility)
 */
export const getDynamicPremium = (planId: string, riskScore: number): number => {
  let base = 25; // Default Pro
  if (planId === "basic") base = 10;
  if (planId === "pro") base = 25;
  if (planId === "elite") base = 50;

  // AI adjustment: base * (1 + riskScore/100)
  const multiplier = 1 + (riskScore / 100);
  return Math.round(base * multiplier);
};

/**
 * Fetches advanced environmental data for risk modeling.
 */
export const getAdvancedWeather = async (city: string) => {
  return {
    rainProbability: 80,
    temperature: 36,
    pollutionIndex: 160
  };
};

/**
 * Generates a complete AI-driven premium profile for a worker.
 */
export const generateAIPremium = async (db: Firestore, user: any) => {
  try {
    const weather = await getAdvancedWeather(user.city || "Mumbai");
    
    // Fetch claim history for frequency feature
    const claimsSnap = await getDocs(query(
      collection(db, "claims"),
      where("worker_id", "==", user.id || user.uid)
    ));
    
    const features = buildFeatures(user, weather, claimsSnap.size);
    const riskScore = computeRiskScore(features);
    
    // Legacy calculation
    const premium = getDynamicPremium(user.plan_id || "pro", riskScore);

    return {
      premium,
      riskScore,
      features,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("[AI Premium] Pipeline Error:", error);
    return {
      premium: 25, 
      riskScore: 50,
      timestamp: Date.now()
    };
  }
};
