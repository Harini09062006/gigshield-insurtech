"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { FirebaseProvider } from "@/firebase/provider";
import { initializeFirebase } from "@/firebase";

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // 🔥 Initialize Firebase ONCE on client
    const services = initializeFirebase();
    setFirebaseServices(services);
  }, []);

  // 🔄 Wait until Firebase is ready
  if (!firebaseServices) {
    return <div>Initializing Firebase...</div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}