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
 */
export function initializeFirebase() {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }

  if (!auth) {
    auth = getAuth(app);
    // Configure persistence once on the singleton instance
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error("❌ Persistence configuration failed:", err);
    });
  }

  if (!firestore) {
    firestore = getFirestore(app);
  }

  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}

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
