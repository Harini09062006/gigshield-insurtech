/**
 * @fileOverview Location service for handling browser geolocation and fraud detection distance checks.
 */

import { Firestore, doc, updateDoc, getDoc } from 'firebase/firestore';

export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Gets the current GPS coordinates from the browser.
 * @returns A promise resolving to latitude and longitude.
 */
export async function getUserLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let msg = "Unknown location error.";
        if (error.code === error.PERMISSION_DENIED) msg = "Please enable location access for fraud verification.";
        if (error.code === error.POSITION_UNAVAILABLE) msg = "Location information is unavailable.";
        if (error.code === error.TIMEOUT) msg = "Location request timed out.";
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Defensive update function for user location.
 * Ensure base location is ONLY stored if it doesn't already exist.
 * This is typically called during or after registration.
 */
export async function saveUserLocation(db: Firestore, userId: string) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    // IMPORTANT CONDITION: Save location ONLY if it does NOT already exist
    if (userSnap.exists() && !userSnap.data().location) {
      const loc = await getUserLocation();
      await updateDoc(userRef, {
        location: {
          lat: loc.lat,
          lng: loc.lng
        },
        // Maintain legacy top-level fields for compatibility with existing components
        lat: loc.lat,
        lng: loc.lng,
        updatedAt: new Date().toISOString()
      });
      console.log("[LocationService] Base location locked for user:", userId);
    }
  } catch (error) {
    console.warn("[LocationService] Skipping GPS capture:", error);
  }
}

/**
 * Implementation of the Haversine formula to calculate distance between two points in km.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Core validation function for GPS-based fraud detection.
 * Returns "PASSED" if distance is under 1km, else "FAILED".
 */
export function gpsCheck(workerLoc?: any, claimLoc?: any): "PASSED" | "FAILED" | "NOT_AVAILABLE" {
  // Support both old flat structure and new nested structure for worker
  const wLat = workerLoc?.location?.lat ?? workerLoc?.lat;
  const wLng = workerLoc?.location?.lng ?? workerLoc?.lng;
  
  // Claim location is captured live during the simulation/payout trigger
  const cLat = claimLoc?.lat;
  const cLng = claimLoc?.lng;

  if (wLat === undefined || wLng === undefined || !cLat || !cLng) {
    return "NOT_AVAILABLE";
  }

  const distance = calculateDistance(wLat, wLng, cLat, cLng);
  
  return distance < 1 ? "PASSED" : "FAILED";
}
