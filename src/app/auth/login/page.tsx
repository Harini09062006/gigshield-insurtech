"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth, useFirestore } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
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
    if (!phone) return;
    
    setLoading(true);
    try {
      // For prototype "No OTP" flow, we sign in anonymously
      // and lookup/associate the user by phone number in Firestore
      await signInAnonymously(auth);
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", phone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        toast({ title: "Welcome Back", description: `Logged in as ${userData.name}` });
        router.push(userData.role === "admin" ? "/admin" : "/worker/overview");
      } else {
        // New user - store phone temporarily in session or just pass via query
        // Since we are signed in anonymously, we proceed to registration
        toast({ title: "New Profile", description: "Please complete your registration." });
        router.push("/register");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page p-4">
      <Card className="w-full max-w-md border-border shadow-card">
        <CardHeader className="space-y-4 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-btn">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-headline font-bold">
              <span className="text-primary">Gig</span>
              <span className="text-heading">Shield</span>
            </span>
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>
              Enter your phone number to continue
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-primary" />
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+91 98765 43210" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 rounded-btn h-12"
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-12 font-bold bg-primary hover:bg-primary-hover shadow-btn" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
            <p className="text-sm text-center text-body">
              New here? <Link href="/register" className="text-primary hover:underline font-bold">Get Protected &rarr;</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
