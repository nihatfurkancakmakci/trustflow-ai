"use client";

import { useWallet } from "@/components/WalletProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Code, Zap, LogOut, FileText, Lock, Search, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function FreelancerSidebarNav() {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "board";

  return (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/freelancer?tab=board" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "board" ? "bg-white/5 text-green-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <Search className="w-5 h-5" />
        Job Board
      </Link>
      <Link href="/freelancer?tab=active" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "active" ? "bg-white/5 text-amber-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <FileText className="w-5 h-5" />
        Pending Proposals
      </Link>
      <Link href="/freelancer?tab=workrooms" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === "workrooms" || currentTab === "workroom_detail" ? "bg-white/5 text-blue-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
        <Lock className="w-5 h-5" />
        Workrooms
      </Link>
    </nav>
  );
}

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, address, disconnect, isInitializing } = useWallet();
  const role = userProfile?.role;
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isInitializing) return;
    if (!address || role !== "freelancer") {
      router.push("/");
    }
  }, [address, role, router, isInitializing]);

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

  if (isInitializing) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>;
  }

  if (!address || role !== "freelancer") return null;

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
          <span className="font-extrabold text-lg">TrustFlow <span className="text-green-500">FL</span></span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 bg-zinc-950 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-500" />
          <span className="font-extrabold text-xl">TrustFlow <span className="text-green-500">FL</span></span>
        </div>
        
        <Suspense fallback={<nav className="flex-1 p-4 space-y-2"></nav>}>
          <FreelancerSidebarNav />
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
            className="lg:hidden fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-white/10 z-50 flex flex-col pt-16 shadow-2xl"
          >
            <Suspense fallback={<nav className="flex-1 p-4 space-y-2"></nav>}>
              <div onClick={() => setIsMobileMenuOpen(false)} className="flex-1 flex flex-col overflow-y-auto">
                <FreelancerSidebarNav />
              </div>
            </Suspense>

            {/* Mobile Drawer Footer with Profile Card & Log Out */}
            {userProfile && (
              <div className="p-4 border-t border-white/10 bg-zinc-950 mt-auto flex flex-col gap-3">
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-lg shrink-0">
                    {(userProfile.firstName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white hover:underline">{userProfile.firstName || ""} {userProfile.lastName || ""}</p>
                    <p className="text-xs text-zinc-500 font-mono">{userProfile.walletAddress.slice(0,6)}...{userProfile.walletAddress.slice(-4)}</p>
                  </div>
                </Link>
                <button 
                  onClick={() => { disconnect(); router.push("/"); setIsMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-3 px-4 py-2.5 w-full bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 font-bold transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            )}
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
