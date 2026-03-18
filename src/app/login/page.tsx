"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  function validatePhone(phone: string) {
    const cleaned = phone.replace(/\s/g, '').replace('+91', '').trim();
    if (cleaned.length !== 10) {
      setErrorMessage('Enter a valid 10-digit phone number');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setErrorMessage('Enter a valid Indian mobile number');
      return false;
    }
    return true;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!validatePhone(phone)) return;
    
    const cleanPhone = phone.replace(/\s/g, '').replace('+91', '').trim();
    const email = cleanPhone + '@gigshield.app';
    const password = cleanPhone.slice(-6) + 'GIG#' + cleanPhone.slice(0, 4);

    setLoading(true);
    try {
      // Authenticate first using virtual credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Now we have permission to read the profile
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        throw new Error('Account not found. Please register.');
      }
      
      const userData = userDoc.data();
      if (userData.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential') {
        setErrorMessage('No account found. Please register first.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many attempts. Wait 5 minutes.');
      } else {
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEEEFF] p-4 font-body">
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

              {errorMessage && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginTop: '12px',
                  color: '#DC2626',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle className="h-4 w-4" /> {errorMessage}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-6 px-8 pb-10 pt-2">
              <Button 
                className="w-full h-14 font-bold bg-[#6C47FF] hover:bg-[#5535E8] shadow-btn rounded-xl text-white text-lg transition-all active:scale-[0.98]" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Logging in...
                  </>
                ) : "Login"}
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