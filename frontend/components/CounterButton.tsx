"use client";

import { Button } from "@/components/ui/button";
import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import {
  appendTransactionMessageInstruction,
  assertIsTransactionMessageWithSingleSendingSigner,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  Address,
  getProgramDerivedAddress,
  getBase58Decoder,
  Signature,
} from "@solana/kit";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";
import { type UiWalletAccount } from "@wallet-standard/react";
import { useContext, useState, useEffect, useRef } from "react";
import { RpcContext } from "../context/RpcContext";
import {
  getIncrementInstruction,
  fetchCounter,
  COUNTER_PROGRAM_ADDRESS,
} from "@/sdk";
import { install } from "@solana/webcrypto-ed25519-polyfill";
import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";
import { toast } from "sonner";
import { ToastContent } from "./ToastContent";

// Install webcrypto polyfill
install();

// Hardcoded Devnet chain value
const DEVNET_CHAIN = "solana:devnet";

// Connected button component - only rendered when wallet is connected
function ConnectedIncrementButton({
  account,
  counterAddress,
  onIncrement,
}: {
  account: UiWalletAccount;
  counterAddress: Address;
  onIncrement: () => void;
}) {
  const { rpc, rpcSubscriptions } = useContext(RpcContext);
  const [isLoading, setIsLoading] = useState(false);

  // Safe to use hook here - component only renders when connected
  const signer = useWalletAccountTransactionSendingSigner(
    account,
    DEVNET_CHAIN
  );

  const handleClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const { value: latestBlockhash } = await rpc
        .getLatestBlockhash({ commitment: "confirmed" })
        .send();

      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayerSigner(signer, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) =>
          appendTransactionMessageInstruction(
            getIncrementInstruction({
              user: signer,
              counter: counterAddress,
            }),
            m
          )
      );

      assertIsTransactionMessageWithSingleSendingSigner(message);

      // Send the transaction
      const signature = await signAndSendTransactionMessageWithSigners(message);

      // Convert signature bytes to string for UI display
      const signatureStr = getBase58Decoder().decode(signature) as Signature;

      // Show success notification immediately after transaction is sent
      const explorerUrl = `https://explorer.solana.com/tx/${signatureStr}?cluster=devnet`;
      toast.success("Transaction Sent!", {
        description: (
          <ToastContent
            transactionSignature={signatureStr}
            explorerUrl={explorerUrl}
          />
        ),
        style: {
          backgroundColor: "#1f1f23",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
        },
        duration: 8000,
      });

      // Still wait for confirmation to update the counter, but don't show another notification
      try {
        const abortController = new AbortController();
        await createRecentSignatureConfirmationPromiseFactory({
          rpc,
          rpcSubscriptions,
        })({
          abortSignal: abortController.signal,
          commitment: "confirmed",
          signature: signatureStr, // Use the original signature bytes directly
        });

        // Refresh counter data
        onIncrement();
      } catch (confirmError) {
        // Log confirmation error but don't show another toast
        console.error("Transaction confirmation failed:", confirmError);
      }
    } catch (err) {
      console.error("Transaction failed to send:", err);
      toast.error("Transaction Failed", {
        description: "Could not send transaction. Please try again later.",
        style: {
          border: "1px solid rgba(239, 68, 68, 0.3)",
          background:
            "linear-gradient(to right, rgba(40, 27, 27, 0.95), rgba(28, 23, 23, 0.95))",
        },
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className="w-[85%] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-11 text-base font-medium"
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-purple-200/50 border-t-purple-200 animate-spin mr-2"></div>
          <span>Processing...</span>
        </div>
      ) : (
        "Increment Counter"
      )}
    </Button>
  );
}

// Main counter component
export function CounterButton() {
  const [counterAddress, setCounterAddress] = useState<Address>();
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const { rpc } = useContext(RpcContext);
  const [count, setCount] = useState<number | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Function to derive PDA - only needs to happen once
  const derivePDA = async () => {
    // Derive the PDA from the program and seeds
    const pdaResult = await getProgramDerivedAddress({
      programAddress: COUNTER_PROGRAM_ADDRESS,
      seeds: ["counter"],
    });
    // Update the counter address with the PDA
    const pdaAddress = pdaResult[0];
    setCounterAddress(pdaAddress);
    return pdaAddress;
  };

  // Function to fetch the counter data - can be called independently
  const fetchCounterData = async (address: Address) => {
    try {
      const counterAccount = await fetchCounter(rpc, address);
      setCount(Number(counterAccount.data.count));
    } catch (e) {
      console.error("Failed to fetch counter data:", e);
    }
  };

  // Initialize on mount - derive PDA and fetch initial counter value
  useEffect(() => {
    const initialize = async () => {
      // First, derive the PDA (will always succeed)
      const pdaAddress = await derivePDA();

      // Fetch initial counter data
      try {
        await fetchCounterData(pdaAddress);
      } catch (e) {
        console.error("Initial counter data fetch failed:", e);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initialize();
  }, []);

  // Handler for refreshing counter after increment
  const refreshCounter = async () => {
    if (counterAddress) {
      await fetchCounterData(counterAddress);
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <div className="text-center w-full px-5">
        <p className="text-sm text-muted-foreground mb-2">Current Count:</p>
        <div className="h-14 flex items-center justify-center">
          {isInitialLoading ? (
            <div className="h-7 w-7 rounded-full border-3 border-purple-400/30 border-t-purple-400 animate-spin" />
          ) : (
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
              {count}
            </p>
          )}
        </div>
      </div>

      {selectedWalletAccount && counterAddress ? (
        <ConnectedIncrementButton
          account={selectedWalletAccount}
          counterAddress={counterAddress}
          onIncrement={refreshCounter}
        />
      ) : (
        <Button
          disabled
          className="w-[85%] bg-gradient-to-r from-purple-600/50 to-blue-600/50 text-white h-11 text-base font-medium opacity-50 cursor-not-allowed"
        >
          Increment Counter
        </Button>
      )}
    </div>
  );
}
