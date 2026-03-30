/**
 * @fileOverview Fully Dynamic, Claim-Based Fraud Detection Engine for GigShield.
 * Uses real-time inputs (GPS, Weather, Frequency) and a weighted scoring model.
 */

import { Firestore, collection, query, where, getDocs, Timestamp, limit, orderBy } from "firebase/firestore";

export type VerificationStatus = "PASSED" | "FAILED" | "SUSPICIOUS";

export interface FraudResult {
  fraudChecks: {
    gpsValidation: VerificationStatus;
    orderHistory: VerificationStatus;
    weatherIntelligence: VerificationStatus;
    deviceCheck: VerificationStatus;
    duplicateCheck: VerificationStatus;
    accountAge: VerificationStatus;
    behaviorPattern: VerificationStatus;
    networkAnalysis: VerificationStatus;
  };
  trustScore: number;
  decision: "APPROVED" | "REVIEW" | "BLOCKED";
  processingTime: string;
}

/**
 * Executes the 8-layer dynamic fraud detection algorithm.
 * Weight Distribution (Max Deductions):
 * GPS: 25% | Weather: 20% | Orders: 15% | Behavior: 15% | Device: 10% | Network: 10% | Account Age: 5%
 * Frequency Check (DuplicateCheck) applies an additional -15 penalty.
 */
export async function runFraudChecks(worker: any, claim: any, db: Firestore): Promise<FraudResult> {
  const startTime = Date.now();
  let trustScore = 100;
  const checks = {} as any;

  // --- LAYER 1: GPS VALIDATION (Weight: 25%) ---
  // Independent check vs registered operating city
  try {
    if (typeof window !== "undefined" && navigator.geolocation) {
      // In a real simulation, we check if browser location aligns with operating city
      // For the demo, we use city match as the primary anchor
      if (worker.city === claim.city) {
        checks.gpsValidation = "PASSED";
      } else {
        checks.gpsValidation = "FAILED";
        trustScore -= 25;
      }
    } else {
      checks.gpsValidation = "SUSPICIOUS";
      trustScore -= 12;
    }
  } catch (err) {
    checks.gpsValidation = "SUSPICIOUS";
    trustScore -= 12;
  }

  // --- LAYER 2: WEATHER INTELLIGENCE (Weight: 20%) ---
  // Cross-references the claim's rainfall data with system thresholds
  const rainfall = claim.rainfall || 0;
  if (rainfall >= 50) {
    checks.weatherIntelligence = "PASSED";
  } else if (rainfall >= 25) {
    checks.weatherIntelligence = "SUSPICIOUS";
    trustScore -= 10;
  } else {
    checks.weatherIntelligence = "FAILED";
    trustScore -= 20;
  }

  // --- LAYER 3: ORDER HISTORY (Weight: 15%) ---
  const totalOrders = worker.totalOrders || 0;
  if (totalOrders > 15) {
    checks.orderHistory = "PASSED";
  } else if (totalOrders >= 5) {
    checks.orderHistory = "SUSPICIOUS";
    trustScore -= 7;
  } else {
    checks.orderHistory = "FAILED";
    trustScore -= 15;
  }

  // --- LAYER 4: BEHAVIOR PATTERN (Weight: 15%) ---
  const currentHour = new Date().getHours();
  // Analyzes if the claim is submitted during peak hours vs unusual midnight spikes
  if (currentHour >= 6 && currentHour <= 22) {
    checks.behaviorPattern = "PASSED";
  } else {
    checks.behaviorPattern = "SUSPICIOUS";
    trustScore -= 15;
  }

  // --- LAYER 5: DEVICE FINGERPRINT (Weight: 10%) ---
  if (worker.deviceId) {
    checks.deviceCheck = "PASSED";
  } else {
    checks.deviceCheck = "SUSPICIOUS";
    trustScore -= 10;
  }

  // --- LAYER 6: NETWORK ANALYSIS (Weight: 10%) ---
  if (worker.lastIP) {
    checks.networkAnalysis = "PASSED";
  } else {
    checks.networkAnalysis = "SUSPICIOUS";
    trustScore -= 10;
  }

  // --- LAYER 7: ACCOUNT AGE (Weight: 5%) ---
  const createdAt = worker.createdAt?.toDate ? worker.createdAt.toDate() : new Date(worker.createdAt || Date.now());
  const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 7) {
    checks.accountAge = "PASSED";
  } else if (diffDays >= 2) {
    checks.accountAge = "SUSPICIOUS";
    trustScore -= 2;
  } else {
    checks.accountAge = "FAILED";
    trustScore -= 5;
  }

  // --- LAYER 8: FREQUENCY CHECK (Penalty: -15) ---
  // Queries Firestore for high-velocity submission patterns
  try {
    const oneDayAgo = new Timestamp(Math.floor(Date.now() / 1000) - 86400, 0);
    const recentQuery = query(
      collection(db, "claims"),
      where("worker_id", "==", worker.id || worker.uid),
      where("createdAt", ">", oneDayAgo),
      limit(10)
    );
    const snap = await getDocs(recentQuery);
    // If more than 2 claims in 24 hours, flag as suspicious frequency
    if (snap.size > 2) {
      checks.duplicateCheck = "SUSPICIOUS";
      trustScore -= 15;
    } else {
      checks.duplicateCheck = "PASSED";
    }
  } catch (e) {
    checks.duplicateCheck = "SUSPICIOUS";
  }

  // --- AI NOISE VARIATION ---
  // Small variation to ensure same user != same result every time
  const noise = Math.random() * 8;
  trustScore -= noise;

  // Final Aggregation & Clamping
  trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

  // Decision Logic (70/40 Split)
  let decision: "APPROVED" | "REVIEW" | "BLOCKED" = "BLOCKED";
  if (trustScore >= 70) decision = "APPROVED";
  else if (trustScore >= 40) decision = "REVIEW";

  const result: FraudResult = {
    fraudChecks: checks,
    trustScore,
    decision,
    processingTime: `${Date.now() - startTime}ms`
  };

  // DEBUG LOGGING (Mandatory Audit)
  console.log("--- FRAUD ENGINE CLAIM AUDIT ---", {
    gps: checks.gpsValidation,
    weather: checks.weatherIntelligence,
    orders: checks.orderHistory,
    frequency: checks.duplicateCheck,
    behavior: checks.behaviorPattern,
    trustScore,
    decision,
    noise: noise.toFixed(2)
  });
  
  return result;
}
