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
    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!normalizedPhone) return;
    
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const newUid = userCredential.user.uid;
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", normalizedPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingData = querySnapshot.docs[0].data();
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
      console.error(error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page p-4">
      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <Link href="/" className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-headline font-bold">
            <span className="text-primary">Gig</span>
            <span className="text-heading">Shield</span>
          </span>
        </Link>

        <Card className="w-full border-border shadow-card rounded-card bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline font-bold text-heading">Welcome Back</CardTitle>
            <CardDescription className="text-body">
              Enter your phone number to continue
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-heading font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+91 98765 43210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 rounded-btn h-12 border-input focus:border-primary bg-white"
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6 pt-2">
              <Button className="w-full h-12 font-bold bg-primary hover:bg-primary-hover shadow-btn rounded-btn text-white transition-all active:scale-95" type="submit" disabled={loading}>
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
    </div>
  );
}
