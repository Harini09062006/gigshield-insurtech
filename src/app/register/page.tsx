"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Phone, Briefcase, MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useFirestore, useAuth } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const PLATFORMS = ["Swiggy", "Zomato", "Uber Eats", "Ola", "Dunzo", "Blinkit", "Other"];
const STATES_CITIES = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur"]
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    platform: "",
    state: "",
    city: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    const cleanPhone = formData.phone.replace(/\s/g, '').replace('+91', '').trim();
    if (cleanPhone.length !== 10) {
      setErrorMessage("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const email = cleanPhone + '@gigshield.app';
      const password = cleanPhone.slice(-6) + 'GIG#' + cleanPhone.slice(0, 4);
      
      // Create user account first to establish UID context
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save user profile
      await setDoc(doc(db, "users", uid), {
        name: formData.name,
        phone: cleanPhone,
        email: email,
        platform: formData.platform,
        state: formData.state,
        city: formData.city,
        id: uid,
        role: "worker",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      router.push("/plans");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Account already exists. Please login.');
      } else {
        setErrorMessage(error.message || 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex flex-col items-center py-10 px-4 font-body">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-btn">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-muted">
            <span className="text-primary flex items-center gap-2">① Basic Info</span>
            <span className="flex items-center gap-2">② Choose Plan</span>
            <span className="flex items-center gap-2">③ Done</span>
          </div>
          <Progress value={33} className="h-2 w-full bg-white border border-border" />
        </div>

        <Card className="border-border shadow-card rounded-card overflow-hidden bg-white">
          <CardHeader>
            <CardTitle className="text-2xl font-headline font-bold text-heading">Tell us about yourself</CardTitle>
            <CardDescription className="text-body">This helps us customize your Income DNA profile</CardDescription>
          </CardHeader>
          <form onSubmit={handleNext}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-heading font-semibold">
                  <User className="h-4 w-4 text-primary" /> Full Name
                </Label>
                <Input 
                  placeholder="Ravi Kumar" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-btn border-border focus:border-primary bg-[#F8F9FF]"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-heading font-semibold">
                  <Phone className="h-4 w-4 text-primary" /> Phone Number
                </Label>
                <Input 
                  placeholder="9342460938" 
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-12 rounded-btn border-border focus:border-primary bg-[#F8F9FF]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-heading font-semibold">
                  <Briefcase className="h-4 w-4 text-primary" /> Delivery Platform
                </Label>
                <Select onValueChange={val => setFormData(prev => ({ ...prev, platform: val }))} required>
                  <SelectTrigger className="h-12 rounded-btn border-border bg-[#F8F9FF]">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-heading font-semibold">
                    <MapPin className="h-4 w-4 text-primary" /> State
                  </Label>
                  <Select onValueChange={val => setFormData(prev => ({ ...prev, state: val, city: "" }))} required>
                    <SelectTrigger className="h-12 rounded-btn border-border bg-[#F8F9FF]">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATES_CITIES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-heading font-semibold">
                    <Navigation className="h-4 w-4 text-primary" /> City
                  </Label>
                  <Select onValueChange={val => setFormData(prev => ({ ...prev, city: val }))} disabled={!formData.state} required>
                    <SelectTrigger className="h-12 rounded-btn border-border bg-[#F8F9FF]">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.state && STATES_CITIES[formData.state as keyof typeof STATES_CITIES].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <CardFooter className="p-6">
              <Button className="w-full h-12 font-bold bg-primary hover:bg-primary-hover shadow-btn rounded-btn text-white" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Next → Choose Your Plan"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}