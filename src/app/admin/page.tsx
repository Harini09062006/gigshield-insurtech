"use client";

import { useUser } from "@/firebase";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();

  console.log("USER:", user);
  console.log("LOADING:", isUserLoading);

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Debug Page</h1>
      <p>Loading: {isUserLoading ? "YES" : "NO"}</p>
      <p>User: {user ? "LOGGED IN ✅" : "NULL ❌"}</p>
    </div>
  );
}