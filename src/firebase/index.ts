'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Initializes Firebase services with explicit local persistence.
 * Local persistence ensures that the user session survives page refreshes and browser restarts.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    try {
      app = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  
  // CRITICAL: Set persistence to local to ensure sessions persist across reloads.
  // This call ensures the auth instance uses Browser Local Storage.
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Auth persistence setup failed:", err);
  });

  return {
    firebaseApp: app,
    auth,
    firestore: getFirestore(app)
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
