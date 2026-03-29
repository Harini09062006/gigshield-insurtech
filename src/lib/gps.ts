/**
 * @fileOverview Core GPS utility library for distance calculation and verification.
 */

export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Gets the current GPS coordinates from the browser.
 */
export async function getUserLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
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
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Haversine formula to calculate distance between two points in km.
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
 * Validates if user is within 1km of their base location.
 */
export function gpsCheck(workerLoc: GeoLocation, claimLoc: GeoLocation): "PASSED" | "FAILED" {
  if (!workerLoc.lat || !workerLoc.lng || !claimLoc.lat || !claimLoc.lng) {
    return "FAILED";
  }

  const distance = calculateDistance(workerLoc.lat, workerLoc.lng, claimLoc.lat, claimLoc.lng);
  return distance <= 1 ? "PASSED" : "FAILED";
}
