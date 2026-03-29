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

// 🔥 Initialize Firebase ONCE (correctly)
export function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // 🔥 Auth setup
  auth = getAuth(app);

  // 🔥 CRITICAL: Ensure local persistence is configured during initialization
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("❌ Persistence configuration failed:", err);
  });

  // 🔥 Firestore
  firestore = getFirestore(app);

  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}

// 🔥 Ensure same instance is reused everywhere
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

// 🔥 exports
export * from "./provider";
export * from "./client-provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./non-blocking-updates";
export * from "./non-blocking-login";
export * from "./errors";
export * from "./error-emitter";
