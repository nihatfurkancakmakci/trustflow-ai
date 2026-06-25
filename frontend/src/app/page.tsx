import { WalletConnect } from "@/components/WalletConnect";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 relative">
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-zinc-50 to-zinc-50 dark:from-indigo-950 dark:via-zinc-950 dark:to-zinc-950 -z-10"></div>
      <WalletConnect />
    </main>
  );
}
