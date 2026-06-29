"use client";

import { Suspense, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { useWallet } from "@/components/WalletProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FreelancerPage() {
  const { address, userProfile, disconnect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      router.push("/");
    }
  }, [address, router]);

  if (!address) return null;

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Freelancer Dashboard</h1>
          <p className="text-zinc-400">Browse jobs, send proposals, and manage your active contracts.</p>
        </div>
        
        {userProfile && (
          <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-lg">
                {userProfile.firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white hover:underline">{userProfile.firstName} {userProfile.lastName}</p>
                <p className="text-xs text-zinc-500 font-mono">{userProfile.walletAddress.slice(0,6)}...{userProfile.walletAddress.slice(-4)}</p>
              </div>
            </Link>
            <Button variant="ghost" size="sm" onClick={disconnect} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 ml-2">Log Out</Button>
          </div>
        )}
      </div>
      
      {/* We pass isEmbedded=true so Dashboard doesn't show the role toggle */}
      <Suspense fallback={<div className="animate-pulse bg-zinc-900/50 h-[800px] rounded-3xl"></div>}>
        <Dashboard pubKey={address} balance={null} initialRole="freelancer" isEmbedded={true} />
      </Suspense>
    </div>
  );
}
