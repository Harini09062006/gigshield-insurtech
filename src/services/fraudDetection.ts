/**
 * @fileOverview Production-ready Fraud Detection Engine for GigShield.
 * Implements 8 layers of verification including GPS, Device Fingerprinting, 
 * Network Analysis, and Weather Intelligence.
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
  limit
} from "firebase/firestore";

export interface FraudChecks {
  gpsValidation: "PASSED" | "FAILED" | "SUSPICIOUS";
  orderHistory: "PASSED" | "FAILED";
  deviceCheck: "PASSED" | "FAILED";
  duplicateCheck: "PASSED" | "FAILED";
  accountAge: "PASSED" | "SUSPICIOUS";
  weatherIntelligence: "PASSED" | "FAILED";
  behaviorPattern: "PASSED" | "SUSPICIOUS";
  networkAnalysis: "PASSED" | "FAILED";
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
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates a 32-character SHA-256 device fingerprint.
 */
async function generateDeviceFingerprint(): Promise<string> {
  try {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join("|");
    
    const encoder = new TextEncoder();
    const dataUint8 = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch (e) {
    return "fallback-fingerprint-" + Math.random().toString(36).slice(2, 18);
  }
}

/**
 * Main Fraud Detection Entry Point.
 * Executes 8 layers of risk analysis.
 */
export const runFraudChecks = async (worker: any, db: Firestore) => {
  let trustScore = 100;
  const checks = {} as FraudChecks;
  const riskFactors: string[] = [];
  const startTime = Date.now();
  
  // Use claimCity if available, else fallback to worker's registered city
  const claimCity = worker.claimCity || worker.city;
  const eventId = `${claimCity}_${new Date().toISOString().split("T")[0]}_rain`;

  // Layer 1: GPS Validation
  try {
    const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
    let lat: number;
    let lng: number;

    // Optional DEV override for laptop testing
    if (isDev && (window as any).__DEV_GPS__) {
      lat = (window as any).__DEV_GPS__.lat;
      lng = (window as any).__DEV_GPS__.lng;
      console.log("Using DEV GPS override:", lat, lng);
    } else {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("No Geolocation Support"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    }
    
    console.log("GPS SOURCE:", isDev && (window as any).__DEV_GPS__ ? "DEV OVERRIDE" : "REAL");
    
    const cityBase = CITY_COORDS[claimCity];
    if (cityBase) {
      const dist = calculateDistance(lat, lng, cityBase.lat, cityBase.lng);
      if (dist < 50) {
        checks.gpsValidation = "PASSED";
      } else {
        checks.gpsValidation = "FAILED";
        trustScore -= 30;
        riskFactors.push(`GPS coordinate mismatch with claim city: ${claimCity}`);
      }
    } else {
      checks.gpsValidation = "SUSPICIOUS";
      trustScore -= 15;
      riskFactors.push(`City coordinates for ${claimCity} not mapped in system`);
    }
  } catch (err: any) {
    checks.gpsValidation = "SUSPICIOUS";
    trustScore -= 15;
    riskFactors.push(`GPS Access Restricted: ${err.message || "User Denied"}`);
  }

  // Layer 2: Order History
  try {
    const userRef = doc(db, "users", worker.id);
    const userSnap = await getDoc(userRef);

    let totalOrders = 0;

    if (userSnap.exists()) {
      const userData = userSnap.data();
      totalOrders = userData?.totalOrders ?? 0;
    }

    if (totalOrders > 10) {
      checks.orderHistory = "PASSED";
    } else {
      checks.orderHistory = "FAILED";
      trustScore -= 20;
      riskFactors.push("Low order history");
    }
  } catch (error) {
    checks.orderHistory = "FAILED";
    trustScore -= 20;
    riskFactors.push("Order history check error");
  }

  // Layer 3: Device Fingerprint
  try {
    const fingerprint = await generateDeviceFingerprint();
    const q = query(collection(db, "users"), where("deviceId", "==", fingerprint));
    const snap = await getDocs(q);
    if (snap.size <= 1) {
      checks.deviceCheck = "PASSED";
    } else {
      checks.deviceCheck = "FAILED";
      trustScore -= 25;
      riskFactors.push("Multiple profiles detected on a single physical device");
    }
    await updateDoc(doc(db, "users", worker.id), { deviceId: fingerprint });
  } catch (e) {
    checks.deviceCheck = "FAILED";
    trustScore -= 25;
    riskFactors.push("Hardware fingerprinting failed");
  }

  // Layer 4: Duplicate Claim Prevention
  try {
    const q = query(
      collection(db, "claims"),
      where("worker_id", "==", worker.id),
      where("eventId", "==", eventId)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      checks.duplicateCheck = "PASSED";
    } else {
      checks.duplicateCheck = "FAILED";
      trustScore -= 40;
      riskFactors.push("Multiple claims detected for the same event timeframe");
    }
  } catch (e) {
    checks.duplicateCheck = "FAILED";
    trustScore -= 40;
    riskFactors.push("Event duplication check error");
  }

  // Layer 5: Account Age Verification
  try {
    const userDoc = await getDoc(doc(db, "users", worker.id));
    const data = userDoc.data();
    if (data && data.createdAt) {
      const createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 3) {
        checks.accountAge = "PASSED";
      } else {
        checks.accountAge = "SUSPICIOUS";
        trustScore -= 15;
        riskFactors.push("High-velocity claim on newly created account");
      }
    }
  } catch (e) {
    checks.accountAge = "SUSPICIOUS";
    trustScore -= 15;
    riskFactors.push("KYC/Account timeline verification failed");
  }

  // Layer 6: Weather Intelligence (OpenWeather)
  try {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
    if (!API_KEY) throw new Error("Weather Key Missing");
    
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(claimCity)}&units=metric&appid=${API_KEY}`);
    const data = await res.json();
    
    const isRaining = data.rain || (data.weather && data.weather.some((w: any) => w.main.toLowerCase().includes("rain")));
    
    if (isRaining) {
      checks.weatherIntelligence = "PASSED";
    } else {
      checks.weatherIntelligence = "FAILED";
      trustScore -= 35;
      riskFactors.push(`Claim context mismatched with meteorological reality in ${claimCity}`);
    }
  } catch (e) {
    checks.weatherIntelligence = "FAILED";
    trustScore -= 35;
    riskFactors.push("Weather API failure - Context verification unavailable");
  }

  // Layer 7: Behavior Pattern Analysis
  try {
    const q = query(collection(db, "activity"), where("userId", "==", worker.id), limit(20));
    const snap = await getDocs(q);
    if (snap.size > 3) {
      checks.behaviorPattern = "PASSED";
    } else {
      checks.behaviorPattern = "SUSPICIOUS";
      trustScore -= 10;
      riskFactors.push("Low app interaction profile detected");
    }
    // Log this check as activity
    await addDoc(collection(db, "activity"), {
      userId: worker.id,
      type: "fraud_assessment_executed",
      timestamp: serverTimestamp()
    });
  } catch (e) {
    checks.behaviorPattern = "SUSPICIOUS";
    trustScore -= 10;
    riskFactors.push("Activity pattern analysis error");
  }

  // Layer 8: Network Analysis (IP Context)
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipRes.json();
    
    const q = query(collection(db, "users"), where("lastIP", "==", ip));
    const snap = await getDocs(q);
    
    if (snap.size <= 5) {
      checks.networkAnalysis = "PASSED";
    } else {
      checks.networkAnalysis = "FAILED";
      trustScore -= 50;
      riskFactors.push("IP address associated with high-density account cluster");
    }
    await updateDoc(doc(db, "users", worker.id), { lastIP: ip });
  } catch (e) {
    checks.networkAnalysis = "FAILED";
    trustScore -= 50;
    riskFactors.push("Network origin verification failure");
  }

  // Final Decision Strategy
  let decision = "APPROVED";
  if (trustScore <= 70 && trustScore >= 40) {
    decision = "REVIEW";
  }
  if (trustScore < 40) {
    decision = "BLOCKED";
  }

  // CRITICAL LAYER ENFORCEMENT
  // Failures in GPS, Duplicates, Network, or Weather bypass trust scores and trigger immediate blocks.
  const criticalFailure = 
    checks.gpsValidation === "FAILED" || 
    checks.duplicateCheck === "FAILED" || 
    checks.networkAnalysis === "FAILED" || 
    checks.weatherIntelligence === "FAILED";

  if (criticalFailure) {
    decision = "BLOCKED";
  }

  return {
    checks,
    trustScore: Math.max(0, trustScore),
    decision,
    eventId,
    processingTime: `${Date.now() - startTime}ms`,
    riskFactors
  };
};