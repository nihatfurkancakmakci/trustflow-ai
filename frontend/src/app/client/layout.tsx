"use client";

import { useWallet } from "@/components/WalletProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import { LayoutDashboard, Briefcase, Zap, Search, LogOut, FileText, Lock, PlusCircle } from "lucide-react";

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

  useEffect(() => {
    if (!address || role !== "client") {
      router.push("/");
    }
  }, [address, role, router]);

  if (!address || role !== "client") return null;

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-zinc-950 flex flex-col">
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

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => { disconnect(); router.push("/"); }}
            className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Disconnect
          </button>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="flex items-center gap-3 px-4 py-3 mt-2 w-full hover:bg-amber-500/10 rounded-xl text-zinc-500 hover:text-amber-500 transition-colors text-sm"
          >
            Reset Test Data
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
