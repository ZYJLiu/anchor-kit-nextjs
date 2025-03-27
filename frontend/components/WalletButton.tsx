"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import {
  UiWallet,
  UiWalletAccount,
  useWallets,
  useConnect,
  useDisconnect,
  uiWalletAccountBelongsToUiWallet,
  uiWalletAccountsAreSame,
} from "@wallet-standard/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSelectedWalletAccount } from "../context/SelectedWalletAccountContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function WalletButton({ children }: { children?: React.ReactNode }) {
  const { current: NO_ERROR } = useRef(Symbol());
  const wallets = useWallets();
  const [selectedWalletAccount, setSelectedWalletAccount] =
    useSelectedWalletAccount();
  const [error, setError] = useState<unknown>(NO_ERROR);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // -------- Helper Functions --------

  // Get error message from various error types
  const getErrorMessage = (
    error: unknown,
    fallback = "Unknown error"
  ): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return fallback;
  };

  // Get wallet icon for an account
  const getWalletIcon = (account: UiWalletAccount) => {
    if (account.icon) return account.icon;

    for (const wallet of wallets) {
      if (uiWalletAccountBelongsToUiWallet(account, wallet)) {
        return wallet.icon;
      }
    }
    return null;
  };

  // Close menu and reset error
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setError(NO_ERROR);
  }, []);

  // -------- Components --------

  // Wallet Icon Component
  const WalletIcon = ({
    wallet,
    size = 18,
  }: {
    wallet: UiWallet;
    size?: number;
  }) => (
    <div className="relative">
      <Avatar style={{ width: `${size}px`, height: `${size}px` }}>
        <AvatarImage src={wallet.icon} alt={wallet.name} />
        <AvatarFallback className="text-xs">
          {wallet.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
    </div>
  );

  // Error Dialog Component
  const ErrorDialog = () => (
    <AlertDialog
      open={error !== NO_ERROR}
      onOpenChange={() => setError(NO_ERROR)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Error
          </AlertDialogTitle>
          <AlertDialogDescription className="border-l-4 border-muted p-4 italic">
            {getErrorMessage(error)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button>Close</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Wallet Menu Item Component
  const WalletMenuItem = ({ wallet }: { wallet: UiWallet }) => {
    const [isConnecting, connect] = useConnect(wallet);
    const [isDisconnecting, disconnect] = useDisconnect(wallet);
    const isPending = isConnecting || isDisconnecting;
    const isConnected = wallet.accounts.length > 0;

    // Handle wallet connect
    const handleConnect = async () => {
      try {
        const existingAccounts = [...wallet.accounts];
        const nextAccounts = await connect();

        // Find the first new account, or use the first account
        const accountToSelect =
          nextAccounts.find(
            (nextAccount) =>
              !existingAccounts.some((existingAccount) =>
                uiWalletAccountsAreSame(nextAccount, existingAccount)
              )
          ) || nextAccounts[0];

        if (accountToSelect) {
          setSelectedWalletAccount(accountToSelect);
          closeMenu();
        }
      } catch (e) {
        setError(e);
      }
    };

    // Handle wallet disconnect
    const handleDisconnect = async (e: Event) => {
      e.preventDefault();
      try {
        await disconnect();
        if (
          selectedWalletAccount &&
          uiWalletAccountBelongsToUiWallet(selectedWalletAccount, wallet)
        ) {
          setSelectedWalletAccount(undefined);
        }
      } catch (e) {
        setError(e);
      }
    };

    // If wallet is not connected, show a single menu item for connecting
    if (!isConnected) {
      return (
        <DropdownMenuItem disabled={isPending} onClick={handleConnect}>
          <div className="flex items-center gap-2">
            <WalletIcon wallet={wallet} />
            <span className="truncate">{wallet.name}</span>
          </div>
        </DropdownMenuItem>
      );
    }

    // If wallet is connected, show a submenu with accounts
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WalletIcon wallet={wallet} />
            <span className="truncate">{wallet.name}</span>
          </div>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuLabel>Accounts</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={selectedWalletAccount?.address}>
            {wallet.accounts.map((account) => (
              <DropdownMenuRadioItem
                key={account.address}
                value={account.address}
                onSelect={() => {
                  setSelectedWalletAccount(account);
                  closeMenu();
                }}
              >
                {account.address.slice(0, 8)}&hellip;
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10"
            onSelect={handleDisconnect}
          >
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  };

  // -------- Main Component Render --------
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            <>
              <ErrorDialog />
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                  >
                    {selectedWalletAccount ? (
                      <>
                        <Image
                          src={getWalletIcon(selectedWalletAccount) || ""}
                          width={18}
                          height={18}
                          alt=""
                        />
                        <span className="ml-2">
                          {selectedWalletAccount.address.slice(0, 8)}
                        </span>
                      </>
                    ) : (
                      children || "Connect Wallet"
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {wallets.length === 0 ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        No wallet adapters found. Please install a compatible
                        wallet.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    wallets.map((wallet) => (
                      <WalletMenuItem key={wallet.name} wallet={wallet} />
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Devnet Only</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
