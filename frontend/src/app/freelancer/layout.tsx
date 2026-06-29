"use client";

import { useWallet } from "@/components/WalletProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import { LayoutDashboard, Code, Zap, LogOut, FileText, Lock, Search } from "lucide-react";

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
  const { userProfile, address, disconnect } = useWallet();
  const role = userProfile?.role;
  const router = useRouter();

  useEffect(() => {
    if (!address || role !== "freelancer") {
      router.push("/");
    }
  }, [address, role, router]);

  if (!address || role !== "freelancer") return null;

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-zinc-950 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-500" />
          <span className="font-extrabold text-xl">TrustFlow <span className="text-green-500">FL</span></span>
        </div>
        
        <Suspense fallback={<nav className="flex-1 p-4 space-y-2"></nav>}>
          <FreelancerSidebarNav />
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
