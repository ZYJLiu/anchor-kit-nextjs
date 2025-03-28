"use client";
import { SelectedWalletAccountProvider } from "./SelectedWalletAccountContext";
import { RpcContextProvider } from "./RpcContext";

type Props = {
  children: React.ReactNode;
};

export function SolanaProviders({ children }: Props) {
  return (
    <RpcContextProvider>
      <SelectedWalletAccountProvider>{children}</SelectedWalletAccountProvider>
    </RpcContextProvider>
  );
}
