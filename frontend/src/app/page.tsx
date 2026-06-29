import { WalletConnect } from "@/components/WalletConnect";
import { WalletProvider } from "@/components/WalletProvider";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative overflow-hidden">
      {/* Premium Dark Mode & Green Gradient Background */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black -z-10"></div>
      
      {/* Decorative blurred glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <WalletProvider>
        <WalletConnect />
      </WalletProvider>
    </main>
  );
}
