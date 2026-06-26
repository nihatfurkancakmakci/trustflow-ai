"use client";

import { useState } from "react";
import { isConnected, getAddress, signTransaction, requestAccess } from "@stellar/freighter-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Horizon, TransactionBuilder, Networks, Asset, Operation, BASE_FEE } from "@stellar/stellar-sdk";
import { motion } from "framer-motion";
import { Wallet, Send, ExternalLink, ShieldCheck, Zap } from "lucide-react";

export function WalletConnect() {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  const server = new Horizon.Server("https://horizon-testnet.stellar.org");

  const fetchBalance = async (publicKey: string) => {
    try {
      const account = await server.loadAccount(publicKey);
      const xlmBalance = account.balances.find((b) => b.asset_type === "native");
      if (xlmBalance) {
        setBalance(xlmBalance.balance);
      } else {
        setBalance("0.0000000");
      }
    } catch (error) {
      console.error("Error fetching balance", error);
      toast.error("Could not fetch balance. Make sure the account is funded on Testnet.");
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const connected = await isConnected();
      if (!connected) {
        toast.error("Freighter wallet is not installed!");
        setIsLoading(false);
        return;
      }
      
      await requestAccess();
      const addressData = await getAddress();
      // Use unknown and type assertions instead of any
      const userAddress = typeof addressData === 'string' 
        ? addressData 
        : typeof addressData === 'object' && addressData !== null
          ? ('address' in addressData ? (addressData as { address: string }).address : ('publicKey' in addressData ? (addressData as { publicKey: string }).publicKey : null))
          : null;
      
      if (userAddress && typeof userAddress === 'string' && userAddress.startsWith("G")) {
        setPubKey(userAddress);
        fetchBalance(userAddress);
        toast.success("Wallet connected successfully!");
      } else {
        toast.error("Could not get public key.");
      }
    } catch (e) {
      console.error("Wallet connection error:", e);
      toast.error("Failed to connect wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setPubKey(null);
    setBalance(null);
    toast.info("Wallet disconnected");
  };

  const sendTransaction = async () => {
    if (!pubKey) return;
    setIsLoading(true);
    setTxHash(null);
    try {
      const account = await server.loadAccount(pubKey);
      
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(Operation.payment({
        destination: receiverAddress,
        asset: Asset.native(),
        amount: amount,
      }))
      .setTimeout(30)
      .build();

      const signedTx = await signTransaction(transaction.toXDR(), {
        networkPassphrase: Networks.TESTNET
      });

      const rawSignedTx = typeof signedTx === 'string' 
        ? signedTx 
        : typeof signedTx === 'object' && signedTx !== null
          ? ('signedTxXdr' in signedTx ? (signedTx as { signedTxXdr: string }).signedTxXdr : ('signedTransaction' in signedTx ? (signedTx as { signedTransaction: string }).signedTransaction : ('tx' in signedTx ? (signedTx as { tx: string }).tx : ('signedTx' in signedTx ? (signedTx as { signedTx: string }).signedTx : null)))) 
          : null;

      if (!rawSignedTx) {
        toast.error("Transaction signature failed.");
        setIsLoading(false);
        return;
      }

      const txBuilder = TransactionBuilder.fromXDR(rawSignedTx as string, Networks.TESTNET);
      const result = await server.submitTransaction(txBuilder as unknown as import("@stellar/stellar-sdk").Transaction);
      
      setTxHash(result.hash);
      toast.success("Transaction successful!");
      fetchBalance(pubKey);
      setReceiverAddress("");
      setAmount("");
    } catch (error) {
      console.error(error);
      toast.error("Transaction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto relative z-10"
    >
      <div className="relative w-full p-[3px] rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10 group/card">
        <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0_280deg,rgba(34,197,94,0.6)_360deg)] animate-[spin_6s_linear_infinite] opacity-50 group-hover/card:opacity-100 transition-opacity duration-1000" />
        
        <Card className="w-full relative z-10 border-none bg-zinc-950/95 backdrop-blur-3xl text-white overflow-hidden rounded-[13px]">
        
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-extrabold flex items-center gap-2">
            <Zap className="w-8 h-8 text-green-500" />
            <span>TrustFlow <span className="text-green-500">AI</span></span>
          </CardTitle>
          <CardDescription className="text-zinc-400">Secure. Fast. Decentralized.</CardDescription>
        </CardHeader>

        <CardContent>
          {!pubKey ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center py-8"
            >
              <Button 
                onClick={connectWallet} 
                disabled={isLoading} 
                size="lg" 
                className="w-full h-14 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 hover:from-green-500 hover:via-emerald-400 hover:to-green-500 text-black font-extrabold text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.7)] betterhover:active:scale-[0.98] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                <Wallet className="w-6 h-6 mr-2 relative z-10" />
                <span className="relative z-10">{isLoading ? "Connecting..." : "Connect Wallet"}</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Wallet Info Box */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <p className="text-xs text-green-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Connected Account
                  </p>
                  <p className="text-sm font-mono break-all text-zinc-300 mt-1">{pubKey}</p>
                </div>
                <div className="relative z-10 pt-3 border-t border-white/10">
                  <p className="text-xs text-green-500 font-semibold uppercase tracking-wider">Testnet Balance</p>
                  <p className="text-4xl font-black text-white mt-1">
                    {balance ? `${balance} XLM` : "Fetching..."}
                  </p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={disconnectWallet} 
                className="w-full bg-red-500/5 border-red-500/30 text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500 rounded-xl h-10 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all font-bold tracking-wide"
              >
                Disconnect
              </Button>
              
              <div className="pt-8 border-t border-white/10 space-y-5">
                  <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-green-500" /> Transfer XLM
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-zinc-400">Destination Address</Label>
                    <Input 
                      id="address" 
                      placeholder="G..." 
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      className="font-mono text-sm bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-green-500 rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-zinc-400">Amount (XLM)</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      placeholder="0.0" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-green-500 rounded-xl h-11"
                    />
                  </div>
                  
                  <Button 
                    onClick={sendTransaction} 
                    disabled={isLoading || !receiverAddress || !amount}
                    className="w-full h-12 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-black font-extrabold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] disabled:opacity-50 disabled:shadow-none betterhover:active:scale-[0.98] group/btn overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    <Send className="w-5 h-5 mr-2 relative z-10" />
                    <span className="relative z-10">{isLoading ? "Processing..." : "Confirm & Send"}</span>
                  </Button>

                  {txHash && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="p-4 mt-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 break-all relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
                      <div className="relative z-10">
                        <p className="font-bold flex items-center gap-2 text-green-500">
                          <ShieldCheck className="w-5 h-5" />
                          Transaction Success!
                        </p>
                        <p className="mt-2 text-xs font-mono opacity-80 text-zinc-300">Hash: {txHash}</p>
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 flex items-center gap-1 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
                        >
                          View on Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
      </div>
    </motion.div>
  );
}
