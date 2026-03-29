/**
 * @fileOverview Location service for handling browser geolocation and fraud detection distance checks.
 */

import { Firestore, doc, updateDoc } from 'firebase/firestore';

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
    if (!navigator.geolocation) {
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
 * Saves location to a user's profile in Firestore.
 */
export async function saveUserLocation(db: Firestore, userId: string, location: GeoLocation) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    location: {
      lat: location.lat,
      lng: location.lng
    },
    // Keep flat fields for backward compatibility if needed by other components
    lat: location.lat,
    lng: location.lng
  });
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
export function gpsCheck(workerLoc?: GeoLocation, claimLoc?: GeoLocation): "PASSED" | "FAILED" | "NOT_AVAILABLE" {
  if (!workerLoc?.lat || !workerLoc?.lng || !claimLoc?.lat || !claimLoc?.lng) {
    return "NOT_AVAILABLE";
  }

  const distance = calculateDistance(workerLoc.lat, workerLoc.lng, claimLoc.lat, claimLoc.lng);
  
  // Requirement: If distance < 1 km → return "PASSED"
  return distance < 1 ? "PASSED" : "FAILED";
}
