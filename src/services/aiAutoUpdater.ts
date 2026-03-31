/**
 * @fileOverview Weekly AI Premium Auto-Updater.
 * Monitors policy age and refreshes risk scores automatically.
 */

import { doc, updateDoc, Firestore } from "firebase/firestore";
import { generateAIPremium } from "./aiPremiumService";

/**
 * Checks if a premium update is required and executes it if the policy window has lapsed.
 * @param db Firestore instance.
 * @param userId ID of the worker.
 * @param userData The current worker profile.
 */
export const autoUpdatePremium = async (db: Firestore, userId: string, userData: any) => {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // If never updated, or update window has passed (7 days)
  if (!userData.lastPremiumUpdated || (now - userData.lastPremiumUpdated > ONE_WEEK)) {
    console.log(`[AI Auto-Updater] Refreshing risk profile for user: ${userId}`);
    
    const result = await generateAIPremium(db, userData);

    await updateDoc(doc(db, "users", userId), {
      premium: result.premium,
      riskScore: result.riskScore,
      lastPremiumUpdated: now,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  }
  
  return false;
};
