"use client";

import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function WalletConnect() {
  const { address, connect, userProfile } = useWallet();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto redirect if already connected
  useEffect(() => {
    if (address && userProfile && !redirecting) {
      setRedirecting(true);
      router.push(`/${userProfile.role}`);
    }
  }, [address, userProfile, router, redirecting]);

  const handleLogin = async () => {
    setIsConnecting(true);
    try {
      const result = await connect();
      if (!result.address) {
        setIsConnecting(false);
        return; // User closed modal
      }
      
      if (result.profile) {
        toast.success("Welcome back!");
        setRedirecting(true);
        router.push(`/${result.profile.role}`);
      } else {
        toast.error("Account not found. Please switch to the Sign Up tab to register.");
        setActiveTab("register");
        setIsConnecting(false);
      }
    } catch (e: any) {
      if (e.message?.includes("rejected") || e.message?.includes("User declined")) {
        toast.error("Connection rejected by user.");
      } else if (e.message?.includes("not found") || e.message?.includes("installed")) {
        toast.error("Wallet not found. Please install Freighter or another Stellar wallet.");
      } else {
        toast.error("Failed to connect wallet.");
      }
      setRedirecting(false);
      setIsConnecting(false);
    }
  };

  const handleRegisterConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connect();
      if (!result.address) {
        setIsConnecting(false);
        return; // User closed modal
      }
      
      if (result.profile) {
        toast.error("An account with this wallet already exists. Logging you in instead!");
        setRedirecting(true);
        router.push(`/${result.profile.role}`);
      } else {
        toast.success("Wallet connected! Please complete your profile.");
        setRedirecting(true);
        router.push("/profile-setup");
      }
    } catch (e: any) {
      if (e.message?.includes("rejected") || e.message?.includes("User declined")) {
        toast.error("Connection rejected by user.");
      } else if (e.message?.includes("not found") || e.message?.includes("installed")) {
        toast.error("Wallet not found. Please install Freighter or another Stellar wallet.");
      } else {
        toast.error("Failed to connect wallet.");
      }
      setRedirecting(false);
      setIsConnecting(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!redirecting ? (
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
                <CardDescription className="text-zinc-400 text-center">The Web3 Freelance Network</CardDescription>
                
                {/* Tabs */}
                <div className="flex justify-center gap-4 pt-6">
                  <button 
                    onClick={() => setActiveTab("login")}
                    className={`pb-2 px-4 border-b-2 transition-all font-bold ${activeTab === "login" ? "border-green-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setActiveTab("register")}
                    className={`pb-2 px-4 border-b-2 transition-all font-bold ${activeTab === "register" ? "border-green-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Sign Up
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                
                <AnimatePresence mode="wait">
                  {/* LOGIN TAB */}
                  {activeTab === "login" && (
                    <motion.div 
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6 flex flex-col items-center py-6"
                    >
                      <p className="text-zinc-400 text-center max-w-[300px]">
                        No passwords required. Just connect your Stellar wallet to securely access your account.
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
                    </motion.div>
                  )}

                  {/* REGISTER TAB */}
                  {activeTab === "register" && (
                    <motion.div 
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6 flex flex-col items-center py-6"
                    >
                      <p className="text-zinc-400 text-center max-w-[300px]">
                        Connect your Stellar wallet to start setting up your TrustFlow AI profile.
                      </p>
                      <Button 
                        onClick={handleRegisterConnect} 
                        disabled={isConnecting} 
                        size="lg" 
                        className="w-full h-14 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-500 text-white font-extrabold text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] betterhover:active:scale-[0.98] relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                        <Wallet className="w-6 h-6 mr-2 relative z-10" />
                        <span className="relative z-10">{isConnecting ? "Connecting..." : "Connect Wallet to Register"}</span>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
              </CardContent>
            </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div key="redirecting" className="flex flex-col items-center justify-center text-white space-y-4 relative z-10">
             <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-zinc-400">{isConnecting ? "Awaiting wallet signature..." : "Loading your workspace..."}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
