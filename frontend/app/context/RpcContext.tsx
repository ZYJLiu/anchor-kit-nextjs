"use client";

import type {
  Rpc,
  RpcSubscriptions,
  SolanaRpcApiDevnet,
  SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  devnet,
} from "@solana/kit";
import { createContext, ReactNode, useContext } from "react";

// Devnet configuration
const DEVNET_RPC_URL = devnet("https://api.devnet.solana.com");
const DEVNET_WEBSOCKET_URL = devnet("wss://api.devnet.solana.com");

// Create the actual RPC instances once to be reused
const rpcInstance = createSolanaRpc(DEVNET_RPC_URL);
const rpcSubscriptionsInstance =
  createSolanaRpcSubscriptions(DEVNET_WEBSOCKET_URL);

// Useful chain information for the rest of the app
export const DEVNET_CHAIN_INFO = {
  chain: "solana:devnet" as const,
  displayName: "Devnet",
  solanaExplorerClusterName: "devnet" as const,
};

// Define the context type
type RpcContextType = {
  rpc: Rpc<SolanaRpcApiDevnet>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

// Create and export the context with default values
// These defaults are only used if no Provider is found in the tree
export const RpcContext = createContext<RpcContextType>({
  rpc: rpcInstance,
  rpcSubscriptions: rpcSubscriptionsInstance,
});

// Export the provider component
type RpcProviderProps = Readonly<{
  children: ReactNode;
}>;

export function RpcContextProvider({ children }: RpcProviderProps) {
  // Since our values never change, we don't need useMemo here
  // We're using the same instances we created at the module level
  return (
    <RpcContext.Provider
      value={{
        rpc: rpcInstance,
        rpcSubscriptions: rpcSubscriptionsInstance,
      }}
    >
      {children}
    </RpcContext.Provider>
  );
}

// Export a custom hook for easier context consumption
export function useRpc() {
  return useContext(RpcContext);
}
