"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  // Redirect if already logged in - Check role first
  useEffect(() => {
    async function handleAuthenticatedRedirect() {
      if (user && !isUserLoading) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            router.replace(role === "admin" ? "/admin" : "/dashboard");
          } else {
            router.replace("/register");
          }
        } catch (e) {
          router.replace("/dashboard");
        }
      }
    }
    handleAuthenticatedRedirect();
  }, [user, isUserLoading, router, db]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanPhone = phone.replace(/\s/g, "").replace("+91", "").trim();
    if (cleanPhone.length !== 10) {
      setErrorMessage("Enter a valid 10-digit phone number");
      return;
    }

    const email = cleanPhone + "@gigshield.app";
    const password = cleanPhone.slice(-6) + "GIG#" + cleanPhone.slice(0, 4);

    setLoading(true);

    try {
      // CRITICAL: Await persistence BEFORE sign in
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch role to determine routing
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new Error("Profile not found. Please register first.");
      }

      const role = userDoc.data().role;
      
      // Brief delay to allow Firebase state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(role === "admin" ? "/admin" : "/dashboard");

    } catch (error: any) {
      console.error("Login Error:", error);
      setErrorMessage("Invalid credentials or network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#EEEEFF]">
        <Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEEEFF] p-4 font-body">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 flex flex-col items-center"
      >
        <div className="w-full flex justify-start mb-4">
          <Link href="/" className="flex items-center gap-2 text-[#6C47FF] hover:text-[#5535E8] font-bold text-sm transition-all group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        <Link href="/" className="flex flex-col items-center">
          <div className="h-16 w-16 bg-[#6C47FF] rounded-2xl flex items-center justify-center shadow-btn mb-3">
            <Shield className="h-9 w-9 text-white" />
          </div>
          <span className="text-4xl font-headline font-bold text-[#1A1A2E] tracking-tight">GigShield</span>
        </Link>

        <Card className="w-full border-none shadow-card rounded-[24px] bg-white p-2">
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-3xl font-headline font-bold text-[#1A1A2E]">Welcome Back</CardTitle>
            <CardDescription className="text-[#64748B] text-base mt-2">Enter your registered phone number</CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 px-8 pt-4">
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-[#1A1A2E] font-semibold text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9342460938"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl h-14 border-[#E8E6FF] bg-[#F8F9FF] focus:border-[#6C47FF] text-lg font-medium transition-all"
                  required
                />
              </div>

              {errorMessage && (
                <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg p-3 text-[#DC2626] text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-6 px-8 pb-10 pt-2">
              <Button className="w-full h-14 font-bold bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl text-white text-lg" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Sign In"}
              </Button>
              <p className="text-sm text-center text-[#64748B]">
                New worker? <Link href="/register" className="text-[#6C47FF] hover:underline font-bold">Get Protected →</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
