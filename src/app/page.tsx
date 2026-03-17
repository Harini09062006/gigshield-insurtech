"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Zap, PieChart, Users, Map, Loader2 } from "lucide-react";
import { useAuth, useUser } from "@/firebase";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/worker/overview");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-headline font-bold tracking-tight text-foreground">GigShield<span className="text-primary">Protection</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/heatmap" className="text-sm font-medium hover:text-primary transition-colors">Global Heatmap</Link>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-primary text-primary-foreground font-bold">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-20 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Income Protection
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 leading-tight">
            The Safety Net for <br /><span className="text-primary">Independent Professionals</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Secure your daily earnings with AI Income DNA profiling, automated payouts, and real-time disruption monitoring.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground h-12 px-8 font-bold text-lg"
              >
                Protect My Income
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="h-12 px-8 font-bold text-lg">
                Admin Portal
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-8 bg-card rounded-2xl border border-border/50 hover:border-primary/50 transition-all group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-3">Income DNA</h3>
              <p className="text-muted-foreground">Advanced profiling identifies your earning peaks and risk factors to tailor your protection plan.</p>
            </div>
            <div className="p-8 bg-card rounded-2xl border border-border/50 hover:border-accent/50 transition-all group">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Map className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-3">Disruption Engine</h3>
              <p className="text-muted-foreground">Detects collective network or logistical outages and triggers payouts automatically.</p>
            </div>
            <div className="p-8 bg-card rounded-2xl border border-border/50 hover:border-primary/50 transition-all group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-3">GigShield Payouts</h3>
              <p className="text-muted-foreground">Instant compensation when your income is disrupted. No paperwork, powered by AI smart contracts.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-10 border-t border-border/50 text-center text-muted-foreground">
        <p className="text-sm">© 2024 GigShield Protection System. Empowering India's Digital Workforce.</p>
      </footer>
    </div>
  );
}
