"use client";

import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Zap, ShieldCheck } from "lucide-react";
import { useTestContract } from "@/hooks/useTestContract";

export function WalletConnect() {
  const { address, connect, disconnect } = useWallet();
  const { testContract, isTesting } = useTestContract();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLogin = async () => {
    setIsConnecting(true);
    try {
      const result = await connect();
      if (!result.address) {
        setIsConnecting(false);
        return;
      }
      toast.success("Wallet connected successfully!");
    } catch (e: any) {
      if (e.message?.includes("rejected") || e.message?.includes("User declined")) {
        toast.error("Connection rejected by user.");
      } else if (e.message?.includes("not found") || e.message?.includes("installed")) {
        toast.error("Wallet not found. Please install Freighter or another Stellar wallet.");
      } else {
        toast.error("Failed to connect wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!address ? (
          <motion.div 
            key="connect-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-6 w-full max-w-xl mx-auto relative z-10"
          >
            <div className="relative w-full p-[3px] rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10 group/card">
              <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0_280deg,rgba(34,197,94,0.6)_360deg)] animate-[spin_6s_linear_infinite] opacity-50 group-hover/card:opacity-100 transition-opacity duration-1000" />
              
              <Card className="w-full relative z-10 border-none bg-zinc-950/95 backdrop-blur-3xl text-white overflow-hidden rounded-[13px]">
              <CardHeader className="pb-4 border-b border-white/5">
                <CardTitle className="text-3xl font-extrabold flex items-center gap-2 justify-center">
                  <Zap className="w-8 h-8 text-green-500" />
                  <span>TrustFlow <span className="text-green-500">AI</span></span>
                </CardTitle>
                <CardDescription className="text-zinc-400 text-center">Stellar Level 2 Submissions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                
                <div className="space-y-6 flex flex-col items-center py-6">
                  <p className="text-zinc-400 text-center max-w-[300px]">
                    Connect your Stellar wallet to test the Escrow Smart Contract functionality.
                  </p>
                  <Button 
                    onClick={handleLogin} 
                    disabled={isConnecting} 
                    size="lg" 
                    className="w-full h-14 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 hover:from-green-500 hover:via-emerald-400 hover:to-green-500 text-black font-extrabold text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.7)] betterhover:active:scale-[0.98] relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    <Wallet className="w-6 h-6 mr-2 relative z-10" />
                    <span className="relative z-10">{isConnecting ? "Connecting..." : "Log In with Wallet"}</span>
                  </Button>
                </div>
                
              </CardContent>
            </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="connected-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-6 w-full max-w-xl mx-auto relative z-10"
          >
            <div className="relative w-full p-[3px] rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10 group/card">
              <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0_280deg,rgba(34,197,94,0.6)_360deg)] animate-[spin_6s_linear_infinite] opacity-50 group-hover/card:opacity-100 transition-opacity duration-1000" />
              
              <Card className="w-full relative z-10 border-none bg-zinc-950/95 backdrop-blur-3xl text-white overflow-hidden rounded-[13px]">
              <CardHeader className="pb-4 border-b border-white/5 text-center">
                <CardTitle className="text-3xl font-extrabold text-green-500 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-8 h-8" />
                  Wallet Connected
                </CardTitle>
                <CardDescription className="text-zinc-400 break-all px-4 mt-2 font-mono text-xs">
                  {address}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                
                <div className="bg-zinc-900/50 p-4 rounded-xl text-sm text-zinc-300 text-center mb-6 border border-zinc-800">
                  <p>You are connected to the Soroban Testnet.</p>
                  <p className="mt-2">Click below to initialize a test escrow on the blockchain.</p>
                </div>

                <Button 
                  onClick={testContract} 
                  disabled={isTesting} 
                  size="lg" 
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] betterhover:active:scale-[0.98]"
                >
                  <Zap className="w-6 h-6 mr-2" />
                  {isTesting ? "Testing Contract..." : "Test Smart Contract"}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={disconnect}
                  className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                >
                  Disconnect
                </Button>
                
              </CardContent>
            </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
