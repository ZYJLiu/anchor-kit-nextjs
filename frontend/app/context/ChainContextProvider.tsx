"use client";
import { mainnet, testnet } from "@solana/kit";
import { useMemo, useState, useEffect } from "react";

import { ChainContext, DEFAULT_CHAIN_CONFIG } from "./ChainContext";

const STORAGE_KEY = "solana-example-react-app:selected-chain";

export function ChainContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chain, setChain] = useState<string>("solana:devnet");

  // Load the saved chain from localStorage when component mounts (client-side only)
  useEffect(() => {
    const savedChain = localStorage.getItem(STORAGE_KEY);
    if (savedChain) {
      setChain(savedChain);
    }
  }, []);

  const contextValue = useMemo<ChainContext>(() => {
    switch (chain) {
      case "solana:mainnet":
        if (process.env.REACT_EXAMPLE_APP_ENABLE_MAINNET === "true") {
          return {
            chain: "solana:mainnet",
            displayName: "Mainnet Beta",
            solanaExplorerClusterName: "mainnet-beta",
            solanaRpcSubscriptionsUrl: mainnet(
              "wss://api.mainnet-beta.solana.com"
            ),
            solanaRpcUrl: mainnet("https://api.mainnet-beta.solana.com"),
          };
        }
      // falls through
      case "solana:testnet":
        return {
          chain: "solana:testnet",
          displayName: "Testnet",
          solanaExplorerClusterName: "testnet",
          solanaRpcSubscriptionsUrl: testnet("wss://api.testnet.solana.com"),
          solanaRpcUrl: testnet("https://api.testnet.solana.com"),
        };
      case "solana:devnet":
      default:
        if (chain !== "solana:devnet") {
          if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
          }
          console.error(`Unrecognized chain \`${chain}\``);
        }
        return DEFAULT_CHAIN_CONFIG;
    }
  }, [chain]);

  return (
    <ChainContext.Provider
      value={useMemo(
        () => ({
          ...contextValue,
          setChain(chain) {
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY, chain);
            }
            setChain(chain);
          },
        }),
        [contextValue]
      )}
    >
      {children}
    </ChainContext.Provider>
  );
}
