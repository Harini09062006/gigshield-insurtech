/**
 * @fileOverview Claim processing service for automated fraud detection and decision making.
 */

export type ClaimDecision = "APPROVED" | "REVIEW" | "BLOCKED";
export type ClaimStatus = "approved" | "review" | "failed";

export interface ClaimResult {
  decision: ClaimDecision;
  status: ClaimStatus;
  reason: string;
}

/**
 * Evaluates a claim based on GPS verification and Trust Score.
 * @param gpsStatus The result of the GPS proximity check.
 * @param trustScore A numeric value (0-100) representing worker reliability.
 */
export function evaluateClaim(gpsStatus: "PASSED" | "FAILED" | "NOT_AVAILABLE", trustScore: number): ClaimResult {
  // Rule 1: Immediate Block if GPS Fails or Trust is critically low
  if (gpsStatus === "FAILED" || trustScore < 40) {
    return {
      decision: "BLOCKED",
      status: "failed",
      reason: gpsStatus === "FAILED" ? "GPS verification failed (outside 1km radius)" : "Critical trust score below threshold"
    };
  }

  // Rule 2: Needs Manual Review if Trust is medium
  if (trustScore >= 40 && trustScore <= 70) {
    return {
      decision: "REVIEW",
      status: "review",
      reason: "Trust score requires manual verification"
    };
  }

  // Rule 3: Automated Approval
  // Only approved if GPS PASSED (or not available but trust is high)
  return {
    decision: "APPROVED",
    status: "approved",
    reason: "All automated fraud checks passed"
  };
}
