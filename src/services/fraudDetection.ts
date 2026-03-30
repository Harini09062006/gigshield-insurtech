/**
 * @fileOverview Production-ready Fraud Detection Engine for GigShield.
 * Implements 8 layers of verification including GPS, Device Fingerprinting, 
 * Network Analysis, and Weather Intelligence using real dynamic data.
 */

import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
  Timestamp
} from "firebase/firestore";

export interface FraudChecks {
  gpsValidation: "PASSED" | "FAILED" | "SUSPICIOUS";
  orderHistory: "PASSED" | "FAILED" | "SUSPICIOUS";
  deviceCheck: "PASSED" | "FAILED";
  duplicateCheck: "PASSED" | "FAILED";
  accountAge: "PASSED" | "FAILED" | "SUSPICIOUS";
  weatherIntelligence: "PASSED" | "FAILED" | "SUSPICIOUS";
  behaviorPattern: "PASSED" | "SUSPICIOUS";
  networkAnalysis: "PASSED" | "FAILED" | "SUSPICIOUS";
}

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Howrah: { lat: 22.5958, lng: 88.2636 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Srivilliputtur: { lat: 9.5094, lng: 77.6323 }
};

/**
 * Haversine formula to calculate distance between two points in KM.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates a deterministic device fingerprint.
 */
async function generateDeviceFingerprint(): Promise<string> {
  try {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height
    ].join("|");
    const encoder = new TextEncoder();
    const dataUint8 = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch (e) {
    return "browser-stable-" + btoa(navigator.userAgent).slice(0, 12);
  }
}

/**
 * Main Fraud Detection Entry Point.
 * Executes 8 layers of real-time risk analysis.
 */
export const runFraudChecks = async (worker: any, db: Firestore) => {
  let trustScore = 100;
  const checks = {} as FraudChecks;
  const startTime = Date.now();
  
  const claimCity = worker.claimCity || worker.city || "Mumbai";
  const userDocRef = doc(db, "users", worker.id);
  const userSnap = await getDoc(userDocRef);
  const userData = userSnap.data() || {};

  // --- LAYER 1: GPS VALIDATION (-30) ---
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    const { latitude: lat, longitude: lng } = pos.coords;
    const cityBase = CITY_COORDS[claimCity];
    
    if (cityBase) {
      const dist = calculateDistance(lat, lng, cityBase.lat, cityBase.lng);
      if (dist < 50) {
        checks.gpsValidation = "PASSED";
      } else if (dist < 100) {
        checks.gpsValidation = "SUSPICIOUS";
        trustScore -= 15;
      } else {
        checks.gpsValidation = "FAILED";
        trustScore -= 30;
      }
    } else {
      checks.gpsValidation = "SUSPICIOUS";
      trustScore -= 10;
    }
  } catch (err) {
    checks.gpsValidation = "SUSPICIOUS";
    trustScore -= 15;
  }

  // --- LAYER 2: ORDER HISTORY (-20) ---
  try {
    // Priority: Field in user doc, Fallback: Count orders collection
    let totalOrders = userData.totalOrders || 0;
    if (totalOrders === 0) {
      const ordersSnap = await getDocs(query(collection(db, "orders"), where("userId", "==", worker.id)));
      totalOrders = ordersSnap.size;
    }

    if (totalOrders > 10) {
      checks.orderHistory = "PASSED";
    } else if (totalOrders >= 5) {
      checks.orderHistory = "SUSPICIOUS";
      trustScore -= 10;
    } else {
      checks.orderHistory = "FAILED";
      trustScore -= 20;
    }
  } catch (e) {
    checks.orderHistory = "FAILED";
    trustScore -= 20;
  }

  // --- LAYER 3: DEVICE FINGERPRINT (-10) ---
  try {
    const currentFingerprint = await generateDeviceFingerprint();
    const storedFingerprint = userData.deviceId;

    if (!storedFingerprint) {
      // First time recording device
      await updateDoc(userDocRef, { deviceId: currentFingerprint });
      checks.deviceCheck = "PASSED";
    } else if (storedFingerprint === currentFingerprint) {
      checks.deviceCheck = "PASSED";
    } else {
      checks.deviceCheck = "FAILED";
      trustScore -= 10;
    }
  } catch (e) {
    checks.deviceCheck = "FAILED";
    trustScore -= 10;
  }

  // --- LAYER 4: DUPLICATE CLAIM (-15) ---
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, "claims"),
      where("worker_id", "==", worker.id),
      where("createdAt", ">", Timestamp.fromDate(yesterday)),
      limit(1)
    );
    const snap = await getDocs(q);
    checks.duplicateCheck = snap.empty ? "PASSED" : "FAILED";
    if (!snap.empty) trustScore -= 15;
  } catch (e) {
    checks.duplicateCheck = "FAILED";
    trustScore -= 15;
  }

  // --- LAYER 5: ACCOUNT AGE (-10) ---
  try {
    const createdAt = userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt || Date.now());
    const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 7) {
      checks.accountAge = "PASSED";
    } else if (diffDays >= 2) {
      checks.accountAge = "SUSPICIOUS";
      trustScore -= 5;
    } else {
      checks.accountAge = "FAILED";
      trustScore -= 10;
    }
  } catch (e) {
    checks.accountAge = "FAILED";
    trustScore -= 10;
  }

  // --- LAYER 6: WEATHER INTELLIGENCE (-25) ---
  try {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "be5f61ff6b261dedfa89e321d466a063";
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(claimCity)},IN&units=metric&appid=${API_KEY}`);
    const data = await res.json();
    const isRaining = data.rain || (data.weather && data.weather.some((w: any) => w.main.toLowerCase().includes("rain")));
    
    if (isRaining) {
      checks.weatherIntelligence = "PASSED";
    } else {
      checks.weatherIntelligence = "FAILED";
      trustScore -= 25;
    }
  } catch (e) {
    checks.weatherIntelligence = "SUSPICIOUS";
    trustScore -= 10;
  }

  // --- LAYER 7: BEHAVIOR PATTERN (-10) ---
  try {
    const now = new Date();
    const currentHour = now.getHours();
    // Simplified behavior check: Claims between 11PM and 5AM are suspicious
    if (currentHour >= 5 && currentHour <= 23) {
      checks.behaviorPattern = "PASSED";
    } else {
      checks.behaviorPattern = "SUSPICIOUS";
      trustScore -= 10;
    }
  } catch (e) {
    checks.behaviorPattern = "SUSPICIOUS";
    trustScore -= 10;
  }

  // --- LAYER 8: NETWORK ANALYSIS (-10) ---
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipRes.json();
    const storedIP = userData.lastIP;

    if (!storedIP || storedIP === ip) {
      checks.networkAnalysis = "PASSED";
      if (!storedIP) await updateDoc(userDocRef, { lastIP: ip });
    } else {
      checks.networkAnalysis = "SUSPICIOUS";
      trustScore -= 10;
    }
  } catch (e) {
    checks.networkAnalysis = "SUSPICIOUS";
    trustScore -= 10;
  }

  // --- FINAL DECISION LOGIC ---
  trustScore = Math.max(0, trustScore);
  let decision: "APPROVED" | "REVIEW" | "BLOCKED" = "BLOCKED";
  
  if (trustScore >= 70) decision = "APPROVED";
  else if (trustScore >= 40) decision = "REVIEW";

  console.log(`[Fraud Engine] Final Trust Score: ${trustScore} | Decision: ${decision}`);

  return {
    checks,
    trustScore,
    decision,
    processingTime: `${Date.now() - startTime}ms`
  };
};
