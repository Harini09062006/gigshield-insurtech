"use client";

import { firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes Firebase services as singletons and configures persistence.
 * Persistence is set to 'browserLocalPersistence' to ensure sessions survive refreshes.
 */
export function initializeFirebase() {
  if (!app) {
    if (!getApps().length) {
      console.log("[Firebase] Initializing App with Project:", firebaseConfig.projectId);
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }

  if (!auth) {
    auth = getAuth(app);
    // CRITICAL: Ensure persistence is configured immediately
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error("❌ Firebase Auth Persistence Error:", err);
    });
  }

  if (!firestore) {
    firestore = getFirestore(app);
    console.log("[Firestore] Service Initialized Instance:", firestore.type === 'firestore' ? 'READY' : 'ERROR');
  }

  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}

// Export singletons for direct import if needed
const { firestore: db, auth: authInstance } = initializeFirebase();
export { db, authInstance as auth };

/**
 * Helper to get initialized SDKs from a provided app instance.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

// Global exports
export * from "./provider";
export * from "./client-provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./non-blocking-updates";
export * from "./non-blocking-login";
export * from "./errors";
export * from "./error-emitter";
