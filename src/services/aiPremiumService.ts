/**
 * @fileOverview AI Premium Orchestration Service.
 * Manages the data flow between weather APIs and the ML models.
 */

import { buildFeatures } from "@/ai/featureBuilder";
import { computeRiskScore } from "@/ai/riskEngine";
import { predictPremium } from "@/ai/premiumModel";
import { Firestore, collection, query, where, getDocs } from "firebase/firestore";

/**
 * Fetches advanced environmental data for risk modeling.
 * In a production app, this would call multiple specialized APIs.
 */
export const getAdvancedWeather = async (city: string) => {
  // Simulating advanced meteorological data
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
    const premium = predictPremium(riskScore);

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
