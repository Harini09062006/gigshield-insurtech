
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, LogIn, UserPlus, Settings, ArrowRight, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/worker/overview");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg-page">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col font-body">
      {/* Navbar */}
      <header className="px-8 py-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold tracking-tight text-heading">
            Gig<span className="text-primary">Shield</span>
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-6 pt-16 pb-20 max-w-7xl mx-auto w-full text-center">
        <div className="max-w-4xl space-y-8 mb-20">
          <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight">
            <span className="text-primary block mb-2">Instant Weather Protection</span>
            <span className="text-heading">for Delivery Workers</span>
          </h1>
          <p className="text-xl text-body max-w-2xl mx-auto leading-relaxed">
            GigShield protects delivery partners from income loss due to heavy rain, floods, or extreme pollution. 
            When severe weather hits, claims are processed instantly—no paperwork required.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Login Card */}
          <div className="bg-white p-10 rounded-[32px] border border-border shadow-card flex flex-col items-start text-left group hover:bg-bg-card-hover transition-colors">
            <div className="h-14 w-14 rounded-2xl bg-primary-light flex items-center justify-center mb-8">
              <LogIn className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4 text-heading">Login</h3>
            <p className="text-body text-base leading-relaxed mb-10 flex-1">
              Return to your account and view your coverage, claims history, and earnings protection.
            </p>
            <Link href="/auth/login" className="inline-flex items-center text-primary font-bold text-lg hover:gap-2 transition-all">
              Sign In <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Signup Card */}
          <div className="bg-white p-10 rounded-[32px] border border-border shadow-card flex flex-col items-start text-left group hover:bg-bg-card-hover transition-colors">
            <div className="h-14 w-14 rounded-2xl bg-primary-light flex items-center justify-center mb-8">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4 text-heading">I'm New Here</h3>
            <p className="text-body text-base leading-relaxed mb-10 flex-1">
              Register to get covered and receive automatic payouts when severe weather strikes your city.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center text-primary font-bold text-lg hover:gap-2 transition-all">
              Get Protected <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Admin Card */}
          <div className="bg-white p-10 rounded-[32px] border border-border shadow-card flex flex-col items-start text-left group hover:bg-bg-card-hover transition-colors">
            <div className="h-14 w-14 rounded-2xl bg-primary-light flex items-center justify-center mb-8">
              <Settings className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4 text-heading">Admin Portal</h3>
            <p className="text-body text-base leading-relaxed mb-10 flex-1">
              Monitor risk events, view active delivery partners, and simulate weather disruptions.
            </p>
            <Link href="/admin" className="inline-flex items-center text-primary font-bold text-lg hover:gap-2 transition-all">
              View Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-8 py-10 text-center text-muted text-sm mt-auto">
        © 2024 GigShield Protection System. Empowering India's Digital Workforce.
      </footer>
    </div>
  );
}
