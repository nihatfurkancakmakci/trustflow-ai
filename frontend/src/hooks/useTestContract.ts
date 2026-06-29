import { useState } from 'react';
import { rpc as stellarRpc, config } from '@/lib/stellar';
import * as StellarSdk from '@stellar/stellar-sdk';
import { toast } from 'sonner';
import { useWallet } from '@/components/WalletProvider';

const CONTRACT_ID = "CAYJUZTTDE3IOSJAH6TA4ZJ4QSAXBT2MKV3RGVOFZCVLE43WYP2ZXFD6";

export function useTestContract() {
  const [isTesting, setIsTesting] = useState(false);
  const { address, sign } = useWallet();

  const testContract = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsTesting(true);
    const loadingToastId = toast.loading("Building transaction...");
    
    try {
      const sourceAccount = await stellarRpc.getAccount(address);
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      
      const jobId = "job_" + Math.floor(Math.random() * 10000);
      
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: "10000",
        networkPassphrase: config.networkPassphrase,
      })
      .addOperation(contract.call("init_escrow", 
        StellarSdk.nativeToScVal(jobId, { type: "string" }), // job_id
        new StellarSdk.Address(address).toScVal(), // client
        new StellarSdk.Address(address).toScVal(), // freelancer
        new StellarSdk.Address("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC").toScVal(), // token (Testnet XLM)
        StellarSdk.xdr.ScVal.scvVec([
          StellarSdk.nativeToScVal(10000000n, { type: "i128" })
        ]), // amounts (1 XLM)
        StellarSdk.xdr.ScVal.scvVec([
          StellarSdk.nativeToScVal(BigInt(Math.floor(Date.now() / 1000) + 86400), { type: "u64" })
        ]), // deadlines (+1 day)
        StellarSdk.nativeToScVal(2, { type: "u32" }) // revision_limit
      ))
      .setTimeout(30)
      .build();
      
      const preparedTx = await stellarRpc.prepareTransaction(tx);
      
      toast.loading("Please sign the transaction in your wallet...", { id: loadingToastId });
      
      const signedXdr = await sign(preparedTx.toXDR());
      if (!signedXdr) throw new Error("Transaction rejected by user");
      
      toast.loading("Submitting to network...", { id: loadingToastId });
      
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
      const sendResponse = await stellarRpc.sendTransaction(signedTx);
      
      if (sendResponse.status === "ERROR") {
        throw new Error(sendResponse.errorResultXdr || "Submission failed");
      }
      
      toast.loading("Waiting for network confirmation...", { id: loadingToastId });
      
      // Poll for completion
      let txStatus = await stellarRpc.getTransaction(sendResponse.hash);
      while (txStatus.status === "NOT_FOUND") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        txStatus = await stellarRpc.getTransaction(sendResponse.hash);
      }
      
      if (txStatus.status === "SUCCESS") {
        toast.success("Transaction successful! Escrow initialized on testnet.", { id: loadingToastId });
      } else {
        toast.error("Transaction failed on the network.", { id: loadingToastId });
      }
      
    } catch (error: any) {
      console.warn("Contract test error:", error);
      if (error?.message?.includes("Insufficient Balance")) {
        toast.error("Insufficient testnet XLM balance.", { id: loadingToastId });
      } else {
        toast.error(error?.message || "Contract test failed.", { id: loadingToastId });
      }
    } finally {
      setIsTesting(false);
    }
  };

  return { testContract, isTesting };
}
