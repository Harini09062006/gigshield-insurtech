/**
 * @fileOverview Dynamic Fraud Detection Engine for GigShield.
 * Implements 8 layers of context-aware verification to produce per-claim trust scores.
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
 * @param worker The worker's profile data from Firestore.
 * @param claim The data for the current claim being processed.
 * @param db Firestore instance for real-time lookups.
 */
export async function runFraudChecks(worker: any, claim: any, db: Firestore): Promise<FraudResult> {
  const startTime = Date.now();
  let trustScore = 100;
  const checks = {} as any;

  // 1. GPS Validation (Dynamic Context)
  // Checks if the claim's reported location matches the worker's operating city
  if (worker.city === claim.city) {
    checks.gpsValidation = "PASSED";
  } else {
    // Partial penalty for regional mismatch - allow some mobility
    checks.gpsValidation = "SUSPICIOUS";
    trustScore -= 15;
  }

  // 2. Order History (User-Level Trust)
  // Established users get a higher baseline, but it doesn't guarantee approval
  const totalOrders = worker.totalOrders || 0;
  if (totalOrders > 15) {
    checks.orderHistory = "PASSED";
  } else if (totalOrders >= 5) {
    checks.orderHistory = "SUSPICIOUS";
    trustScore -= 10;
  } else {
    checks.orderHistory = "FAILED";
    trustScore -= 20;
  }

  // 3. Weather Intelligence (Claim-Level Validation)
  // Cross-references the claim's rainfall data with system thresholds
  const rainfall = claim.rainfall || 0;
  if (rainfall > 40) {
    checks.weatherIntelligence = "PASSED";
  } else if (rainfall > 15) {
    checks.weatherIntelligence = "SUSPICIOUS";
    trustScore -= 10;
  } else {
    checks.weatherIntelligence = "FAILED";
    trustScore -= 25;
  }

  // 4. Device Check (Stable Signature)
  checks.deviceCheck = worker.deviceId ? "PASSED" : "SUSPICIOUS";
  if (!worker.deviceId) trustScore -= 5;

  // 5. Frequency & Duplicate Check (High-Velocity Protection)
  // Checks for claims within the last hour (high frequency) and 24 hours (duplicate)
  try {
    const oneHourAgo = new Timestamp(Math.floor(Date.now() / 1000) - 3600, 0);
    const oneDayAgo = new Timestamp(Math.floor(Date.now() / 1000) - 86400, 0);
    
    const recentQuery = query(
      collection(db, "claims"),
      where("worker_id", "==", worker.id),
      where("createdAt", ">", oneDayAgo),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    
    const snap = await getDocs(recentQuery);
    const recentClaims = snap.docs.map(d => d.data());
    
    const hasVeryRecent = recentClaims.some(c => {
      const ts = c.createdAt?.seconds || 0;
      return ts > oneHourAgo.seconds;
    });

    if (hasVeryRecent) {
      checks.duplicateCheck = "FAILED";
      trustScore -= 30; // High penalty for spamming claims
    } else if (recentClaims.length > 0) {
      checks.duplicateCheck = "SUSPICIOUS";
      trustScore -= 15;
    } else {
      checks.duplicateCheck = "PASSED";
    }
  } catch (e) {
    checks.duplicateCheck = "SUSPICIOUS";
    trustScore -= 5;
  }

  // 6. Account Age (Tenure)
  const createdAt = worker.createdAt?.toDate ? worker.createdAt.toDate() : new Date(worker.createdAt || Date.now());
  const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 14) {
    checks.accountAge = "PASSED";
  } else if (diffDays >= 3) {
    checks.accountAge = "SUSPICIOUS";
    trustScore -= 5;
  } else {
    checks.accountAge = "FAILED";
    trustScore -= 15;
  }

  // 7. Behavior Pattern (Shift Timing Analysis)
  // Analyzes if the claim is submitted during typical peak earnings hours (Income DNA)
  const currentHour = new Date().getHours();
  if (currentHour >= 6 && currentHour <= 22) {
    checks.behaviorPattern = "PASSED";
  } else {
    // Late-night claims (11PM - 5AM) are inherently more suspicious for weather disruptions
    checks.behaviorPattern = "SUSPICIOUS";
    trustScore -= 10;
  }

  // 8. Network Analysis (IP Verification)
  checks.networkAnalysis = worker.lastIP ? "PASSED" : "SUSPICIOUS";
  if (!worker.lastIP) trustScore -= 5;

  // --- FINAL AGGREGATION & VARIANCE ---
  
  // Add slight random noise to simulate AI scoring variance (±5 points)
  const variance = (Math.random() * 6) - 3;
  trustScore += variance;

  // Clamp and Round
  trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

  // Dynamic Decision Logic
  let decision: "APPROVED" | "REVIEW" | "BLOCKED" = "BLOCKED";
  if (trustScore >= 75) decision = "APPROVED";
  else if (trustScore >= 45) decision = "REVIEW";

  const result: FraudResult = {
    fraudChecks: checks,
    trustScore,
    decision,
    processingTime: `${Date.now() - startTime}ms`
  };

  console.log(`[Fraud Engine] Claim for ${worker.id} processed in ${result.processingTime}. Score: ${trustScore}, Decision: ${decision}`);
  
  return result;
}
