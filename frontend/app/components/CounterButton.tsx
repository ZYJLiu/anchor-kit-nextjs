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
  Signature,
  SignatureBytes,
  getBase58Decoder,
  address,
  Address,
} from "@solana/kit";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";
import { type UiWalletAccount } from "@wallet-standard/react";
import { useContext, useState, useEffect } from "react";
import { RpcContext } from "../context/RpcContext";
import { getIncrementInstruction, fetchCounter } from "@/sdk";
import { install } from "@solana/webcrypto-ed25519-polyfill";
import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";
install();

// Hardcoded Devnet chain value
const DEVNET_CHAIN = "solana:devnet";

// Connected button component - only rendered when wallet is connected
function ConnectedButton({
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
              counter: address(counterAddress),
            }),
            m
          )
      );

      assertIsTransactionMessageWithSingleSendingSigner(message);
      const signature = await signAndSendTransactionMessageWithSigners(message);

      await createRecentSignatureConfirmationPromiseFactory({
        rpc,
        rpcSubscriptions,
      })({
        abortSignal: new AbortController().signal,
        commitment: "confirmed",
        signature: getBase58Decoder().decode(signature) as Signature,
      });

      onIncrement();
    } catch (e) {
      console.error("Transaction failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={`w-[150px] ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : (
        "Increment Counter"
      )}
    </Button>
  );
}

// Main counter component
export function CounterButton() {
  const counterAddress = address(
    "C9q5pGjGzrKz1qCM6UPBZiCGcJcHPF4gZn7Bmn6B8oQP"
  );
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const { rpc } = useContext(RpcContext);
  const [count, setCount] = useState<number | undefined>();

  // Load counter value
  const loadCounter = async () => {
    try {
      const counterAccount = await fetchCounter(rpc, counterAddress);
      setCount(Number(counterAccount.data.count));
    } catch (e) {
      console.error("Failed to load counter value:", e);
    }
  };

  // Load initial counter value
  useEffect(() => {
    loadCounter();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {count !== undefined && (
        <p className="text-2xl font-bold">Count: {count}</p>
      )}

      {selectedWalletAccount ? (
        <ConnectedButton
          account={selectedWalletAccount}
          counterAddress={counterAddress}
          onIncrement={loadCounter}
        />
      ) : (
        <Button disabled className="w-[150px] opacity-50 cursor-not-allowed">
          Increment Counter
        </Button>
      )}
    </div>
  );
}
