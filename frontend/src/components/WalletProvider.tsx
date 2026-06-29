"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useStellarWallet } from "@/hooks/useStellarWallet";

type WalletContextType = ReturnType<typeof useStellarWallet>;

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useStellarWallet();

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
