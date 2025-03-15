"use client";
import { ChainContextProvider } from "./ChainContextProvider";
import { SelectedWalletAccountContextProvider } from "./SelectedWalletAccountContextProvider";
import { RpcContextProvider } from "./RpcContextProvider";

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <ChainContextProvider>
      <SelectedWalletAccountContextProvider>
        <RpcContextProvider>{children}</RpcContextProvider>
      </SelectedWalletAccountContextProvider>
    </ChainContextProvider>
  );
}
