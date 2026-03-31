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

let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firebaseDb: Firestore;

/**
 * Initializes Firebase services as singletons and configures persistence.
 * Persistence is set to 'browserLocalPersistence' to ensure sessions survive refreshes.
 */
export function initializeFirebase() {
  if (!firebaseApp) {
    if (!getApps().length) {
      console.log("[Firebase] Initializing App with Project:", firebaseConfig.projectId);
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
  }

  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
    // CRITICAL: Ensure persistence is configured immediately
    setPersistence(firebaseAuth, browserLocalPersistence).catch((err) => {
      console.error("❌ Firebase Auth Persistence Error:", err);
    });
  }

  if (!firebaseDb) {
    firebaseDb = getFirestore(firebaseApp);
    console.log("[Firestore] Service Connected to Project:", firebaseConfig.projectId);
  }

  return {
    firebaseApp,
    auth: firebaseAuth,
    firestore: firebaseDb,
  };
}

// Export singletons for direct import if needed
const services = initializeFirebase();
export const db = services.firestore;
export const auth = services.auth;

/**
 * Helper to get initialized SDKs from a provided app instance.
 */
export function getSdks(appInstance: FirebaseApp) {
  return {
    firebaseApp: appInstance,
    auth: getAuth(appInstance),
    firestore: getFirestore(appInstance),
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
