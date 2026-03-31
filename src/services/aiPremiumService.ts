/**
 * @fileOverview AI Premium Orchestration Service.
 * Manages the data flow between weather APIs and the ML models.
 */

import { buildFeatures } from "@/ai/featureBuilder";
import { computeRiskScore } from "@/ai/riskEngine";
import { Firestore, collection, query, where, getDocs } from "firebase/firestore";

/**
 * Calculates a dynamic premium based on the selected plan and AI risk score.
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
  // In a production app, this would call real meteorological APIs
  // For demo persistence, we use consistent simulated values
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
    
    // Use the plan-based dynamic multiplier
    const premium = getDynamicPremium(user.plan_id || "pro", riskScore);

    console.log(`[AI Premium] Risk Score: ${riskScore} | Decision: ₹${premium}`);

    return {
      premium,
      riskScore,
      features,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("[AI Premium] Pipeline Error:", error);
    return {
      premium: 25, // Fallback to base
      riskScore: 50,
      timestamp: Date.now()
    };
  }
};
