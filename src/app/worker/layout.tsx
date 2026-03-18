"use client";

import { ReactNode } from "react";
import { Shield, Home, FileText, LogOut, Map as MapIcon, Brain } from "lucide-react";
import Link from "next/link";
import { useAuth, useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isUserLoading && !user) {
    router.push("/auth/login");
    return null;
  }

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-white sticky top-0 z-50">
        <Link href="/worker/overview" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold">
            <span className="text-primary">Gig</span>
            <span className="text-heading">Shield</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/worker/overview">
            <Button variant="ghost" size="icon" className={pathname === "/worker/overview" ? "text-primary bg-primary-light" : "text-body"}>
              <Home className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/worker/claims">
            <Button variant="ghost" size="icon" className={pathname === "/worker/claims" ? "text-primary bg-primary-light" : "text-body"}>
              <FileText className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/heatmap">
            <Button variant="ghost" size="icon" className={pathname === "/heatmap" ? "text-primary bg-primary-light" : "text-body"}>
              <MapIcon className="h-6 w-6" />
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-danger hover:bg-danger-bg">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}