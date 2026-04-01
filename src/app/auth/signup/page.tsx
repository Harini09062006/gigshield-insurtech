"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, User, Phone, Briefcase, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth, useFirestore } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = ["Swiggy", "Zomato"];
const STATES = ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "Gujarat", "West Bengal"];
const CITIES: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Srivilliputtur"]
};

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    platform: "",
    state: "",
    city: ""
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "Please login with phone first." });
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        ...formData,
        id: auth.currentUser.uid,
        role: "worker",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push("/worker/plans");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error saving profile", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-btn">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest">
            <span className="text-primary flex items-center gap-2">① <span className="hidden sm:inline">Basic Info</span></span>
            <span className="text-muted flex items-center gap-2">② <span className="hidden sm:inline">Choose Plan</span></span>
            <span className="text-muted flex items-center gap-2">③ <span className="hidden sm:inline">Done</span></span>
          </div>
          <Progress value={33} className="h-2 w-full bg-white border border-border" />
        </div>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Tell us about yourself</CardTitle>
            <CardDescription>This helps us customize your Income DNA profile</CardDescription>
          </CardHeader>
          <form onSubmit={handleNext}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Full Name
                </Label>
                <Input 
                  placeholder="Ravi Kumar" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-btn"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Phone Number
                </Label>
                <Input 
                  placeholder="+91 98765 43210" 
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-12 rounded-btn"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> Delivery Platform
                </Label>
                <Select onValueChange={val => setFormData(prev => ({ ...prev, platform: val }))} required>
                  <SelectTrigger className="h-12 rounded-btn">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> State
                  </Label>
                  <Select onValueChange={val => setFormData(prev => ({ ...prev, state: val, city: "" }))} required>
                    <SelectTrigger className="h-12 rounded-btn">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" /> City
                  </Label>
                  <Select onValueChange={val => setFormData(prev => ({ ...prev, city: val }))} disabled={!formData.state} required>
                    <SelectTrigger className="h-12 rounded-btn">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {(CITIES[formData.state] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full h-12 font-bold bg-primary hover:bg-primary-hover shadow-btn" type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Next → Choose Your Plan"}
              </Button>
              <p className="text-sm text-center text-body">
                Already protected? <Link href="/auth/login" className="text-primary hover:underline font-bold">Login</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
