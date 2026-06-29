import { useState } from 'react';
import { rpc, TransactionBuilder, Networks, Contract, nativeToScVal, Account, Address, xdr } from '@stellar/stellar-sdk';
import { useStellarWallet } from './useStellarWallet';

const SERVER_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = "CAYJUZTTDE3IOSJAH6TA4ZJ4QSAXBT2MKV3RGVOFZCVLE43WYP2ZXFD6";
// Native XLM token address on Testnet
const XLM_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export function useEscrowContract() {
  const { address, sign } = useStellarWallet();
  const [isTxPending, setIsTxPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const invokeContract = async (method: string, args: any[]) => {
    if (!address) throw new Error("Wallet not connected");
    setIsTxPending(true);
    setTxHash(null);

    try {
      const server = new rpc.Server(SERVER_URL);
      
      const accountResponse = await server.getAccount(address);
      const account = new Account(address, accountResponse.sequenceNumber());

      const contract = new Contract(CONTRACT_ID);

      const txBuilder = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const operation = contract.call(method, ...args);
      txBuilder.addOperation(operation);
      txBuilder.setTimeout(60);
      const tx = txBuilder.build();

      const simulatedTx = await server.simulateTransaction(tx);
      
      if (!rpc.Api.isSimulationSuccess(simulatedTx)) {
        const errStr = typeof simulatedTx.error === "string" ? simulatedTx.error : JSON.stringify(simulatedTx.error);
        if (errStr.includes("resulting balance is not within the allowed range")) {
          throw new Error("Insufficient Balance: You do not have enough XLM in your wallet.");
        } else if (errStr.includes("Missing signature") || errStr.includes("Unauthorized")) {
          throw new Error("Signature missing or unauthorized. Are you sure you are the right party for this action?");
        }
        throw new Error("Simulation failed: " + errStr);
      }

      const assembledTx = rpc.assembleTransaction(tx, simulatedTx).build();

      const signedXdr = await sign(assembledTx.toXDR());
      if (!signedXdr) throw new Error("Transaction rejected by user");

      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const sendResponse = await server.sendTransaction(signedTx);
      
      if (sendResponse.status === "ERROR") {
        throw new Error("Submission failed");
      }

      let statusResponse = await server.getTransaction(sendResponse.hash);
      while (statusResponse.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        statusResponse = await server.getTransaction(sendResponse.hash);
      }

      if (statusResponse.status === "SUCCESS") {
        setTxHash(sendResponse.hash);
        return sendResponse.hash;
      } else {
        throw new Error("Transaction failed on chain");
      }
    } catch (error) {
      console.warn(`Escrow ${method} Error:`, error);
      throw error;
    } finally {
      setIsTxPending(false);
    }
  };

  const initEscrow = async (jobId: string, freelancerAddress: string, amountsXlm: number[], deadlinesMs: number[], revisionLimit: number) => {
    const amountsStroops = amountsXlm.map(a => BigInt(Math.floor(a * 10000000)));
    const deadlinesSec = deadlinesMs.map(d => BigInt(Math.floor(d / 1000)));

    const amountsVal = xdr.ScVal.scvVec(
      amountsStroops.map(a => nativeToScVal(a, { type: "i128" }))
    );
    const deadlinesVal = xdr.ScVal.scvVec(
      deadlinesSec.map(d => nativeToScVal(d, { type: "u64" }))
    );

    const args = [
      nativeToScVal(jobId, { type: "string" }),
      new Address(address!).toScVal(),
      new Address(freelancerAddress).toScVal(),
      new Address(XLM_TOKEN_ID).toScVal(),
      amountsVal,
      deadlinesVal,
      nativeToScVal(revisionLimit, { type: "u32" }),
    ];
    return invokeContract("init_escrow", args);
  };

  const submitMilestone = async (jobId: string, milestoneIndex: number) => {
    const args = [
      nativeToScVal(jobId, { type: "string" }),
      nativeToScVal(milestoneIndex, { type: "u32" }),
    ];
    return invokeContract("submit_milestone", args);
  };

  const approveMilestone = async (jobId: string, milestoneIndex: number) => {
    const args = [
      nativeToScVal(jobId, { type: "string" }),
      nativeToScVal(milestoneIndex, { type: "u32" }),
    ];
    return invokeContract("approve_milestone", args);
  };

  const requestRevision = async (jobId: string, milestoneIndex: number) => {
    const args = [
      nativeToScVal(jobId, { type: "string" }),
      nativeToScVal(milestoneIndex, { type: "u32" }),
    ];
    return invokeContract("request_revision", args);
  };

  const dispute = async (jobId: string, milestoneIndex: number) => {
    const args = [
      nativeToScVal(jobId, { type: "string" }),
      nativeToScVal(milestoneIndex, { type: "u32" }),
    ];
    return invokeContract("raise_dispute", args);
  };

  return { initEscrow, submitMilestone, approveMilestone, requestRevision, dispute, isTxPending, txHash };
}
