"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Search, Loader2, Home, FileText, Map as MapIcon, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const MapComponent = dynamic(
  () => import('@/components/heatmap/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] flex flex-col items-center justify-center bg-[#EDE9FF]/10 rounded-2xl border border-dashed border-[#E8E6FF] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#6C47FF]" />
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
          Initializing Disruption Engine...
        </p>
      </div>
    )
  }
);

export default function HeatmapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userRef);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  if (isUserLoading || !mounted) return <div className="h-screen flex items-center justify-center bg-[#EEEEFF]"><Loader2 className="animate-spin text-[#6C47FF] h-10 w-10" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-full bg-[#EEEEFF] flex flex-col overflow-hidden font-body"
    >
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E8E6FF] bg-white sticky top-0 z-50 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[#6C47FF] rounded-xl flex items-center justify-center shadow-btn">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-headline font-bold text-[#1A1A2E]">
            Gig<span className="text-[#6C47FF]">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard"><Button variant="ghost" size="icon" className="text-[#64748B]"><Home className="h-6 w-6" /></Button></Link>
          <Link href="/claims"><Button variant="ghost" size="icon" className="text-[#64748B]"><FileText className="h-6 w-6" /></Button></Link>
          <Link href="/heatmap"><Button variant="ghost" size="icon" className="text-[#6C47FF] bg-[#EDE9FF]"><MapIcon className="h-6 w-6" /></Button></Link>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-[#EF4444]"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#DCFCE7] text-[#22C55E] border-none px-3 py-1 font-bold animate-pulse text-[10px]">
                  LIVE ENGINE ACTIVE
                </Badge>
                <h1 className="text-xl font-bold text-[#1A1A2E] hidden sm:block">Risk Heat Intelligence</h1>
              </div>
              <p className="text-[10px] text-[#94A3B8] font-mono mt-1 uppercase tracking-wider">
                Syncing disruption data for {userData?.city ?? 'India'}
              </p>
            </div>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <input 
              placeholder="Search state or district..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-[#E8E6FF] rounded-xl pl-10 pr-10 py-2 text-sm focus:outline-none focus:border-[#6C47FF] transition-all shadow-sm" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EF4444]"><X className="h-4 w-4" /></button>
            )}
          </div>
        </div>

        <div className="flex-1 w-full relative">
           <MapComponent searchQuery={searchQuery} workerState={userData?.state} />
        </div>
      </main>
    </motion.div>
  );
}
