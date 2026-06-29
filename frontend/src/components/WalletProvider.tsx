"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useContractEvents } from "@/hooks/useContractEvents";

type WalletContextType = ReturnType<typeof useStellarWallet>;

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useStellarWallet();
  useContractEvents(); // Listen for smart contract events globally

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
