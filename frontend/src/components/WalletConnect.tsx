"use client";

import { useState, useEffect } from "react";
import { isAllowed, setAllowed, getAddress, signTransaction, isConnected, requestAccess } from "@stellar/freighter-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Horizon, TransactionBuilder, Networks, Asset, Operation, BASE_FEE } from "@stellar/stellar-sdk";

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
        toast.error("Freighter wallet is not installed! Please install the Freighter browser extension.");
        setIsLoading(false);
        return;
      }
      
      await requestAccess(); // Ask for connection permission
      const addressData = await getAddress();
      const userAddress = typeof addressData === 'string' ? addressData : (addressData as any)?.address || (addressData as any)?.publicKey;
      
      if (userAddress && typeof userAddress === 'string' && userAddress.startsWith("G")) {
        setPubKey(userAddress);
        fetchBalance(userAddress);
        toast.success("Wallet connected successfully!");
      } else {
        toast.error("Could not get public key. Please unlock your Freighter wallet.");
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
        networkPassphrase: Networks.TESTNET,
        network: "TESTNET"
      });

      if ((signedTx as any)?.error) {
        throw new Error((signedTx as any).error);
      }
      
      const rawSignedTx = typeof signedTx === 'string' ? signedTx : typeof signedTx === 'object' ? ((signedTx as any).signedTransaction || (signedTx as any).tx || (signedTx as any).signedTx) : null;

      if (!rawSignedTx) {
        const errorMsg = "Freighter response: " + JSON.stringify(signedTx);
        console.error(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      const txBuilder = TransactionBuilder.fromXDR(rawSignedTx as string, Networks.TESTNET);
      const result = await server.submitTransaction(txBuilder as any);
      
      setTxHash(result.hash);
      toast.success("Transaction successful!");
      fetchBalance(pubKey); // Refresh balance
      setReceiverAddress("");
      setAmount("");
    } catch (error) {
      console.error(error);
      toast.error("Transaction failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto">
      <Card className="w-full border-zinc-200 dark:border-zinc-800 shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TrustFlow AI</CardTitle>
          <CardDescription>Level 1 - White Belt Submission</CardDescription>
        </CardHeader>
        <CardContent>
          {!pubKey ? (
            <div className="flex justify-center py-8">
              <Button onClick={connectWallet} disabled={isLoading} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isLoading ? "Connecting..." : "Connect Freighter Wallet"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Connected Account</p>
                <p className="text-sm font-medium break-all text-zinc-700 dark:text-zinc-300">{pubKey}</p>
                <div className="pt-2">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Testnet Balance</p>
                  <p className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{balance ? `${balance} XLM` : "Fetching..."}</p>
                </div>
              </div>
              <Button variant="outline" onClick={disconnectWallet} className="w-full">
                Disconnect Wallet
              </Button>
              
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-semibold text-lg">Send Test Transaction</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Destination Address</Label>
                  <Input 
                    id="address" 
                    placeholder="G..." 
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (XLM)</Label>
                  <Input 
                    id="amount" 
                    type="number"
                    placeholder="1.5" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={sendTransaction} 
                  disabled={isLoading || !receiverAddress || !amount}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  {isLoading ? "Processing..." : "Send XLM"}
                </Button>

                {txHash && (
                  <div className="p-4 mt-4 text-sm rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 break-all">
                    <p className="font-bold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                      Transaction Success!
                    </p>
                    <p className="mt-2 text-xs opacity-80">Hash: {txHash}</p>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block font-semibold underline hover:no-underline"
                    >
                      View on Stellar Expert →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
