"use client";

import { useWallet } from "@/components/WalletProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Briefcase, Zap, Search, LogOut, FileText, Lock, PlusCircle, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ClientSidebarNav() {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "dashboard";

  return (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/client?tab=dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "dashboard" ? "bg-white/5 text-green-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <LayoutDashboard className="w-5 h-5" />
        Admin Overview
      </Link>
      <Link href="/client?tab=active" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "active" ? "bg-white/5 text-blue-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <Briefcase className="w-5 h-5" />
        My Posted Jobs
      </Link>
      <Link href="/client?tab=proposals" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "proposals" ? "bg-white/5 text-amber-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <FileText className="w-5 h-5" />
        Pending Proposals
      </Link>
      <Link href="/client?tab=workrooms" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "workrooms" || currentTab === "workroom_detail" ? "bg-white/5 text-blue-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <Lock className="w-5 h-5" />
        Active Escrows
      </Link>
      <Link href="/client?tab=discover" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "discover" ? "bg-white/5 text-emerald-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <Search className="w-5 h-5" />
        Discover Talent
      </Link>
    </nav>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, address, disconnect } = useWallet();
  const role = userProfile?.role;
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!address || role !== "client") {
      router.push("/");
    }
  }, [address, role, router]);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!address || role !== "client") return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black text-white overflow-hidden">
      
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center gap-4 p-4 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          <span className="font-extrabold text-lg">TrustFlow <span className="text-green-500">Client</span></span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 bg-zinc-950 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-500" />
          <span className="font-extrabold text-xl">TrustFlow <span className="text-green-500">Client</span></span>
        </div>
        
        <Suspense fallback={<nav className="flex-1 p-4 space-y-2"></nav>}>
          <div className="px-4 pt-4 pb-2">
            <Link href="/client?tab=create" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
              <PlusCircle className="w-5 h-5" />
              Post New Job
            </Link>
          </div>
          <ClientSidebarNav />
        </Suspense>

        {/* Desktop Sidebar Footer - Log Out at the very bottom */}
        <div className="p-4 border-t border-white/10 bg-zinc-950 mt-auto">
          <button 
            onClick={() => { disconnect(); router.push("/"); }}
            className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="lg:hidden fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-white/10 z-50 flex flex-col pt-16 shadow-2xl"
          >
            <div className="px-4 pt-4 pb-2">
              <Link 
                href="/client?tab=create" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <PlusCircle className="w-5 h-5" />
                Post New Job
              </Link>
            </div>
            
            <Suspense fallback={<nav className="flex-1 p-4 space-y-2"></nav>}>
              <div onClick={() => setIsMobileMenuOpen(false)} className="flex-1 flex flex-col overflow-y-auto">
                <ClientSidebarNav />
              </div>
            </Suspense>

            {/* Mobile Drawer Footer with Log Out at the very bottom */}
            <div className="p-4 border-t border-white/10 bg-zinc-950 mt-auto">
              <button 
                onClick={() => { disconnect(); router.push("/"); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
