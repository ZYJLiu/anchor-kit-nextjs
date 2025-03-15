"use client";
import {
  UiWallet,
  UiWalletAccount,
  uiWalletAccountBelongsToUiWallet,
  uiWalletAccountsAreSame,
  useWallets,
} from "@wallet-standard/react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Types
export type SelectedWalletAccountState = UiWalletAccount | undefined;

// Constants
const STORAGE_KEY = "wallet";

// Context
export const SelectedWalletAccountContext = createContext<
  readonly [
    selectedWalletAccount: SelectedWalletAccountState,
    setSelectedWalletAccount: (account: SelectedWalletAccountState) => void
  ]
>([
  undefined, // selectedWalletAccount
  () => {}, // setSelectedWalletAccount (empty function)
]);

// Track if user has explicitly set a wallet
let wasSetterInvoked = false;

// Helper to get saved wallet account
function getSavedWalletAccount(
  wallets: readonly UiWallet[]
): UiWalletAccount | undefined {
  if (typeof window === "undefined") return undefined;
  if (wasSetterInvoked) {
    // After the user makes an explicit choice of wallet, stop trying to auto-select the
    // saved wallet, if and when it appears.
    return;
  }

  const savedWalletNameAndAddress = localStorage.getItem(STORAGE_KEY);
  if (
    !savedWalletNameAndAddress ||
    typeof savedWalletNameAndAddress !== "string"
  ) {
    return;
  }

  const [savedWalletName, savedAccountAddress] =
    savedWalletNameAndAddress.split(":");
  if (!savedWalletName || !savedAccountAddress) {
    return;
  }

  for (const wallet of wallets) {
    if (wallet.name === savedWalletName) {
      for (const account of wallet.accounts) {
        if (account.address === savedAccountAddress) {
          return account;
        }
      }
    }
  }
}

// Context Provider
export function SelectedWalletAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useWallets();
  const [selectedWalletAccount, setSelectedWalletAccountInternal] =
    useState<SelectedWalletAccountState>(() => getSavedWalletAccount(wallets));

  // Custom setter that also saves to localStorage
  const setSelectedWalletAccount: React.Dispatch<
    React.SetStateAction<SelectedWalletAccountState>
  > = (setStateAction) => {
    setSelectedWalletAccountInternal((prevSelectedWalletAccount) => {
      wasSetterInvoked = true;
      const nextWalletAccount =
        typeof setStateAction === "function"
          ? setStateAction(prevSelectedWalletAccount)
          : setStateAction;

      // Save to localStorage when an account is selected
      if (typeof window !== "undefined") {
        if (nextWalletAccount) {
          // Find the wallet this account belongs to
          for (const wallet of wallets) {
            if (uiWalletAccountBelongsToUiWallet(nextWalletAccount, wallet)) {
              localStorage.setItem(
                STORAGE_KEY,
                `${wallet.name}:${nextWalletAccount.address}`
              );
              break;
            }
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      return nextWalletAccount;
    });
  };

  // Load saved wallet on initial mount and when wallets change
  useEffect(() => {
    const savedWalletAccount = getSavedWalletAccount(wallets);
    if (savedWalletAccount) {
      setSelectedWalletAccountInternal(savedWalletAccount);
    }
  }, [wallets]);

  // The key improvement: resolve the actual account to use with fallbacks
  const walletAccount = useMemo(() => {
    if (selectedWalletAccount) {
      // Phase 1: Try to find exact match for the selected account
      for (const uiWallet of wallets) {
        for (const uiWalletAccount of uiWallet.accounts) {
          if (uiWalletAccountsAreSame(selectedWalletAccount, uiWalletAccount)) {
            return uiWalletAccount;
          }
        }

        // Phase 2: If the selected account belongs to this wallet but wasn't found,
        // return the first account from the same wallet as a fallback
        if (
          uiWalletAccountBelongsToUiWallet(selectedWalletAccount, uiWallet) &&
          uiWallet.accounts[0]
        ) {
          // If the selected account belongs to this connected wallet, at least, then
          // select one of its accounts.
          return uiWallet.accounts[0];
        }
      }
    }
    // Return undefined if no match found
    return undefined;
  }, [selectedWalletAccount, wallets]);

  // Clear selected wallet if the wallet disconnects
  useEffect(() => {
    // If there is a selected wallet account but the wallet to which it belongs has since
    // disconnected, clear the selected wallet.
    if (selectedWalletAccount && !walletAccount) {
      setSelectedWalletAccountInternal(undefined);
    }
  }, [selectedWalletAccount, walletAccount]);

  return (
    <SelectedWalletAccountContext.Provider
      value={useMemo(
        () => [walletAccount, setSelectedWalletAccount],
        [walletAccount, setSelectedWalletAccount]
      )}
    >
      {children}
    </SelectedWalletAccountContext.Provider>
  );
}

// Hook
export function useSelectedWalletAccount() {
  return useContext(SelectedWalletAccountContext);
}
