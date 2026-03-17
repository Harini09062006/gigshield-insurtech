"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Zap, PieChart, Map as MapIcon, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-bg-page flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
             <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold tracking-tight">
            <span className="text-primary">Gig</span>
            <span className="text-heading">Shield</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/heatmap" className="text-sm font-medium text-body hover:text-primary transition-colors">Global Heatmap</Link>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-primary hover:bg-primary-light">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-primary hover:bg-primary-hover text-white font-bold shadow-btn">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-20 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Income Protection
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 leading-tight">
            <span className="text-primary">The Safety Net for</span><br />
            <span className="text-heading">Independent Professionals</span>
          </h1>
          <p className="text-lg text-body max-w-2xl mx-auto mb-10">
            Secure your daily earnings with AI Income DNA profiling, automated payouts, and real-time disruption monitoring.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-hover text-white h-12 px-8 font-bold text-lg shadow-btn"
              >
                Protect My Income
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="h-12 px-8 font-bold text-lg border-primary text-primary hover:bg-primary-light">
                Admin Portal
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-8 bg-white rounded-card border border-border shadow-card hover:border-primary transition-all group">
              <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <PieChart className="h-6 w-6 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-3 text-heading">Income DNA</h3>
              <p className="text-body">Advanced profiling identifies your earning peaks and risk factors to tailor your protection plan.</p>
              <Link href="/auth/login" className="inline-flex items-center mt-4 text-primary font-bold">Sign In &rarr;</Link>
            </div>
            <div className="p-8 bg-white rounded-card border border-border shadow-card hover:border-primary transition-all group">
              <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <MapIcon className="h-6 w-6 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-3 text-heading">Disruption Engine</h3>
              <p className="text-body">Detects collective network or logistical outages and triggers payouts automatically.</p>
              <Link href="/auth/login" className="inline-flex items-center mt-4 text-primary font-bold">Sign In &rarr;</Link>
            </div>
            <div className="p-8 bg-white rounded-card border border-border shadow-card hover:border-primary transition-all group">
              <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <Shield className="h-6 w-6 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-3 text-heading">GigShield Payouts</h3>
              <p className="text-body">Instant compensation when your income is disrupted. No paperwork, powered by AI smart contracts.</p>
              <Link href="/auth/login" className="inline-flex items-center mt-4 text-primary font-bold">Sign In &rarr;</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-10 border-t border-border bg-white text-center text-muted">
        <p className="text-sm">© 2024 GigShield Protection System. Empowering India's Digital Workforce.</p>
      </footer>
    </div>
  );
}