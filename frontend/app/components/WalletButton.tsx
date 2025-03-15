"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { AlertTriangle, Loader2 } from "lucide-react";
import { StandardConnect, StandardDisconnect } from "@wallet-standard/core";
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
import { cn } from "@/lib/utils";
import { useSelectedWalletAccount } from "../context/useSelectedWalletAccount";

export function WalletButton({ children }: { children?: React.ReactNode }) {
  //   const { wallet, setWallet, chain, rpc } = useWallet();
  //   console.log(wallet);
  //   console.log(chain);
  //   console.log(rpc);
  const { current: NO_ERROR } = useRef(Symbol());
  const wallets = useWallets();
  const [selectedWalletAccount, setSelectedWalletAccount] =
    useSelectedWalletAccount();
  const [error, setError] = useState<unknown>(NO_ERROR);
  const [forceClose, setForceClose] = useState(false);

  // Helper function to get error message
  const getErrorMessage = (
    error: unknown,
    fallback: string = "Unknown error"
  ): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return fallback;
  };

  // Wallet Account Icon Component
  const WalletAccountIcon = ({
    account,
    ...imageProps
  }: { account: UiWalletAccount } & Omit<
    React.ComponentProps<typeof Image>,
    "src"
  >) => {
    const wallets = useWallets();
    let icon;
    if (account.icon) {
      icon = account.icon;
    } else {
      for (const wallet of wallets) {
        if (uiWalletAccountBelongsToUiWallet(account, wallet)) {
          icon = wallet.icon;
          break;
        }
      }
    }
    return icon ? <Image src={icon} {...imageProps} alt="" /> : null;
  };

  // Wallet Menu Item Content Component
  const WalletMenuItemContent = ({
    children,
    loading,
    wallet,
  }: {
    children?: React.ReactNode;
    loading?: boolean;
    wallet: UiWallet;
  }) => {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin absolute inset-0 m-auto" />
          )}
          <Avatar className={cn("h-[18px] w-[18px]", loading && "opacity-50")}>
            <AvatarImage src={wallet.icon} alt={wallet.name} />
            <AvatarFallback className="text-xs">
              {wallet.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </div>
        <span className="truncate">{children ?? wallet.name}</span>
      </div>
    );
  };

  // Error Dialog Component
  const ErrorDialog = ({
    error,
    onClose,
    title,
  }: {
    error: unknown;
    onClose?: () => false | void;
    title?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <AlertDialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            if (!onClose || onClose() !== false) {
              setIsOpen(false);
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {title ?? "We encountered the following error"}
            </AlertDialogTitle>
            <AlertDialogDescription className="border-l-4 border-muted p-4 italic">
              {getErrorMessage(error, "Unknown")}
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
  };

  // Unconnectable Wallet Menu Item Component
  const UnconnectableWalletMenuItem = ({
    error,
    wallet,
  }: {
    error: unknown;
    wallet: UiWallet;
  }) => {
    const [dialogIsOpen, setDialogIsOpen] = useState(false);

    return (
      <>
        <DropdownMenuItem
          disabled
          onClick={() => setDialogIsOpen(true)}
          className="flex justify-between items-center"
        >
          <WalletMenuItemContent wallet={wallet}>
            <span className="line-through">{wallet.name}</span>
          </WalletMenuItemContent>
          <AlertTriangle className="h-4 w-4 ml-2" />
        </DropdownMenuItem>

        {dialogIsOpen ? (
          <ErrorDialog
            error={error}
            onClose={() => setDialogIsOpen(false)}
            title="Unconnectable wallet"
          />
        ) : null}
      </>
    );
  };

  // Connect Wallet Menu Item Component
  const ConnectWalletMenuItem = ({ wallet }: { wallet: UiWallet }) => {
    const [isConnecting, connect] = useConnect(wallet);
    const [isDisconnecting, disconnect] = useDisconnect(wallet);
    const isPending = isConnecting || isDisconnecting;
    const isConnected = wallet.accounts.length > 0;

    const handleConnectClick = useCallback(async () => {
      try {
        const existingAccounts = [...wallet.accounts];
        const nextAccounts = await connect();
        // Try to choose the first never-before-seen account.
        for (const nextAccount of nextAccounts) {
          if (
            !existingAccounts.some((existingAccount) =>
              uiWalletAccountsAreSame(nextAccount, existingAccount)
            )
          ) {
            setSelectedWalletAccount(nextAccount);
            setForceClose(true);
            return;
          }
        }
        // Failing that, choose the first account in the list.
        if (nextAccounts[0]) {
          setSelectedWalletAccount(nextAccounts[0]);
          setForceClose(true);
        }
      } catch (e) {
        setError(e);
      }
    }, [connect, wallet.accounts]);

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

    // Main component return
    return (
      <DropdownMenuSub open={!isConnected ? false : undefined}>
        <DropdownMenuSubTrigger
          className="flex items-center justify-between"
          disabled={isPending}
          onClick={!isConnected ? handleConnectClick : undefined}
        >
          <WalletMenuItemContent loading={isPending} wallet={wallet} />
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
                  setForceClose(true);
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

  // Render wallet item
  function renderItem(wallet: UiWallet) {
    try {
      return <ConnectWalletMenuItem wallet={wallet} />;
    } catch (error) {
      return <UnconnectableWalletMenuItem error={error} wallet={wallet} />;
    }
  }

  // Filter wallets by support for standard connect/disconnect
  const walletsThatSupportStandardConnect = [];
  const unconnectableWallets = [];

  for (const wallet of wallets) {
    if (
      wallet.features.includes(StandardConnect) &&
      wallet.features.includes(StandardDisconnect)
    ) {
      walletsThatSupportStandardConnect.push(wallet);
    } else {
      unconnectableWallets.push(wallet);
    }
  }

  return (
    <>
      <DropdownMenu
        open={forceClose ? false : undefined}
        onOpenChange={() => setForceClose(false)}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {selectedWalletAccount ? (
              <>
                <WalletAccountIcon
                  account={selectedWalletAccount}
                  width="18"
                  height="18"
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
                This browser has no wallets installed.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {walletsThatSupportStandardConnect.map((wallet) => (
                <React.Fragment key={wallet.name}>
                  {renderItem(wallet)}
                </React.Fragment>
              ))}
              {unconnectableWallets.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {unconnectableWallets.map((wallet) => (
                    <React.Fragment key={wallet.name}>
                      {renderItem(wallet)}
                    </React.Fragment>
                  ))}
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {error !== NO_ERROR ? (
        <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} />
      ) : null}
    </>
  );
}
