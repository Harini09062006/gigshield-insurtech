"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth, useFirestore } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    if (!normalizedPhone) return;
    
    setLoading(true);
    try {
      // Sign in anonymously to get context
      const userCredential = await signInAnonymously(auth);
      const newUid = userCredential.user.uid;
      
      // Look for existing profile
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", normalizedPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingData = querySnapshot.docs[0].data();
        // Bridge existing data to current session
        await setDoc(doc(db, "users", newUid), {
          ...existingData,
          id: newUid,
          lastLoginAt: serverTimestamp(),
        }, { merge: true });

        toast({ title: "Welcome Back", description: `Logged in as ${existingData.name}` });
        router.replace(existingData.role === "admin" ? "/admin" : "/dashboard");
      } else {
        toast({ title: "New Profile", description: "Please complete your registration." });
        router.push("/register");
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message || "An unexpected error occurred." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page p-4 font-body">
      <div className="w-full max-w-md space-y-10 flex flex-col items-center">
        <Link href="/" className="flex flex-col items-center">
          <div className="h-16 w-16 bg-[#6C47FF] rounded-2xl flex items-center justify-center shadow-btn mb-3">
            <Shield className="h-9 w-9 text-white" />
          </div>
          <span className="text-4xl font-headline font-bold text-[#1A1A2E] tracking-tight">
            GigShield
          </span>
        </Link>

        <Card className="w-full border-none shadow-card rounded-[24px] bg-white p-2">
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-3xl font-headline font-bold text-[#1A1A2E]">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-[#64748B] text-base mt-2">
              Enter your phone number to continue
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 px-8 pt-4">
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-[#1A1A2E] font-semibold text-sm">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6C47FF]" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="9342460938" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 rounded-xl h-14 border-[#E8E6FF] bg-[#F8F9FF] focus:border-[#6C47FF] text-lg font-medium transition-all"
                    required 
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-6 px-8 pb-10 pt-2">
              <Button 
                className="w-full h-14 font-bold bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl text-white text-lg transition-all active:scale-[0.98]" 
                type="submit" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Login"}
              </Button>
              <div className="text-center">
                <p className="text-sm text-[#64748B]">
                  New here? <Link href="/register" className="text-[#6C47FF] hover:underline font-bold">Get Protected &rarr;</Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}