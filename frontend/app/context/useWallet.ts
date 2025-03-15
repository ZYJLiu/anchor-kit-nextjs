"use client";
import { useSelectedWalletAccount } from "./useSelectedWalletAccount";
import { useContext } from "react";
import { ChainContext } from "./ChainContext";
import { RpcContext } from "./RpcContext";

export function useWallet() {
  const [selectedWalletAccount, setSelectedWalletAccount] =
    useSelectedWalletAccount();
  const chainContext = useContext(ChainContext);
  const { rpc } = useContext(RpcContext);

  return {
    wallet: selectedWalletAccount,
    setWallet: setSelectedWalletAccount,
    chain: chainContext,
    rpc,
  };
}
