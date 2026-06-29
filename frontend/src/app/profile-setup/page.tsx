"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Code, Sparkles, ArrowRight, User } from "lucide-react";

export default function ProfileSetupPage() {
  const { address, userProfile, fetchUserProfile, disconnect } = useWallet();
  const router = useRouter();

  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  
  // Basic Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Professional Info
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [website, setWebsite] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!address) {
      router.push("/");
    } else if (userProfile) {
      router.push(`/${userProfile.role}`);
    }
  }, [address, userProfile, router]);

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Please fill in the required fields (First Name, Last Name, Email).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          role,
          firstName,
          lastName,
          email,
          phone,
          location,
          bio,
          skills,
          website
        })
      });

      if (!res.ok) throw new Error("Registration failed");
      
      toast.success("Profile created successfully! Redirecting to dashboard...");
      
      if (address) {
        await fetchUserProfile(address);
        router.push(`/${role}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (!address) return null;

  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* Left Side - Brand/Visual */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] xl:w-[500px] bg-zinc-950 border-r border-white/5 p-12 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-500/20 via-black to-black opacity-50"></div>
        <div className="absolute top-1/2 left-0 w-full h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-bold tracking-tight">TrustFlow AI</span>
          </div>

          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}}>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tighter mb-6">
              Your Web3 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                Reputation
              </span><br/>
              Starts Here.
            </h1>
            <p className="text-zinc-400 text-lg max-w-sm">
              Complete your professional profile to unlock decentralized escrows, zero-fee payments, and global talent.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Connected Wallet</p>
              <p className="text-sm font-mono text-zinc-300">{address.slice(0,6)}...{address.slice(-4)}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
            onClick={handleDisconnect}
          >
            Change
          </Button>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-start justify-center p-8 lg:p-16 relative overflow-y-auto h-screen custom-scrollbar">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none fixed"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-2xl relative z-10 pb-20"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-2">Complete Profile</h2>
            <p className="text-zinc-400">Fill in your professional details to establish your Web3 identity.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Account Type Toggle */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Account Type</label>
              <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setRole("freelancer")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${role === "freelancer" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
                >
                  <Code className="w-4 h-4" /> Find Work (Freelancer)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${role === "client" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
                >
                  <Briefcase className="w-4 h-4" /> Hire Talent (Client)
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">First Name <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder="John" 
                    className="bg-black border-zinc-800 focus-visible:ring-green-500 h-12 rounded-xl"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">Last Name <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder="Doe" 
                    className="bg-black border-zinc-800 focus-visible:ring-green-500 h-12 rounded-xl"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">Email Address <span className="text-red-500">*</span></label>
                  <Input 
                    type="email"
                    placeholder="john@example.com" 
                    className="bg-black border-zinc-800 focus-visible:ring-green-500 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">Phone Number</label>
                  <Input 
                    type="tel"
                    placeholder="+1 (555) 000-0000" 
                    className="bg-black border-zinc-800 focus-visible:ring-green-500 h-12 rounded-xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-300">Location (City, Country)</label>
                <Input 
                  placeholder="San Francisco, USA" 
                  className="bg-black border-zinc-800 focus-visible:ring-green-500 h-12 rounded-xl"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-5 pt-4">
              <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Professional Details</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-300">
                  {role === 'client' ? 'Company Description' : 'Professional Bio'}
                </label>
                <Textarea 
                  placeholder={role === 'client' ? 'What does your company do?' : 'Tell us about your background and expertise...'} 
                  className="bg-black border-zinc-800 focus-visible:ring-green-500 min-h-[120px] resize-none rounded-xl"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">
                    {role === 'client' ? 'Industry' : 'Top Skills'}
                  </label>
                  <Input 
                    placeholder={role === 'client' ? 'e.g. DeFi, Gaming, SaaS' : 'e.g. React, Rust, Smart Contracts'} 
                    className="bg-black border-zinc-800 focus-visible:ring-green-500 h-12 rounded-xl"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-300">
                    {role === 'client' ? 'Company Website' : 'Portfolio / GitHub URL'}
                  </label>
                  <Input 
                    type="url"
                    placeholder="https://..." 
                    className="bg-black border-zinc-800 focus-visible:ring-green-500 h-12 rounded-xl"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Button 
                type="submit" 
                disabled={isSubmitting || !firstName.trim() || !lastName.trim() || !email.trim()}
                className="w-full h-14 bg-white hover:bg-zinc-200 text-black font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Save Profile & Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-center text-zinc-500 text-xs mt-4">
                By creating a profile, you agree to the TrustFlow AI Terms of Service and Privacy Policy.
              </p>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}
