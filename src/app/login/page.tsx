
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {}
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setStep("otp");
      toast({ title: "OTP Sent", description: "Verification code sent to your phone." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to send OTP", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (newOtp.every(digit => digit !== "") && newOtp.length === 4) {
      verifyOtp(newOtp.join(""));
    } else if (value !== "" && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const verifyOtp = async (otpCode: string) => {
    if (!confirmationResult) return;
    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(otpCode);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        router.push(role === "admin" ? "/admin" : "/worker/overview");
      } else {
        router.push("/register");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: error.message });
      setOtp(["", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page p-4">
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-headline font-bold">
            <span className="text-primary">Gig</span>
            <span className="text-heading">Shield</span>
          </span>
        </div>

        <Card className="w-full border-border shadow-card rounded-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline font-bold text-heading">Welcome Back</CardTitle>
            <CardDescription className="text-body">
              {step === "phone" ? "Enter your phone number to continue" : "Enter the 4-digit code sent to your phone"}
            </CardDescription>
          </CardHeader>
          
          {step === "phone" ? (
            <form onSubmit={handleSendOtp}>
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
                      className="pl-12 rounded-btn h-12 border-input focus:border-primary"
                      required 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-6 pt-2">
                <Button className="w-full h-12 font-bold bg-primary hover:bg-primary-hover shadow-btn" type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
                <p className="text-sm text-center text-body">
                  New here? <Link href="/register" className="text-primary hover:underline font-bold">Get Protected &rarr;</Link>
                </p>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-6 pt-4">
              <div className="flex justify-between gap-3 px-4">
                {otp.map((digit, idx) => (
                  <Input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-bold rounded-btn border-input focus:border-primary"
                  />
                ))}
              </div>
              <Button 
                className="w-full h-12 font-bold bg-primary hover:bg-primary-hover shadow-btn" 
                onClick={() => verifyOtp(otp.join(""))}
                disabled={loading || otp.some(d => d === "")}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>
              <div className="text-center">
                <button 
                  onClick={() => setStep("phone")}
                  className="text-sm text-muted font-medium hover:text-primary transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
