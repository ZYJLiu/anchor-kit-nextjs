"use client";

import { Button } from "@/components/ui/button";
import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import {
  Address,
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
} from "@solana/kit";
import { createRecentSignatureConfirmationPromiseFactory } from "@solana/transaction-confirmation";
import { type UiWalletAccount } from "@wallet-standard/react";
import { useContext, useRef, useState, useEffect } from "react";
import { ChainContext } from "../context/ChainContext";
import { RpcContext } from "../context/RpcContext";
import { getIncrementInstruction, fetchCounter } from "@/sdk";
import { install } from "@solana/webcrypto-ed25519-polyfill";
import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";
install();

// This is the main component that handles conditionals
export function CounterButton() {
  const counterAddress = address(
    "C9q5pGjGzrKz1qCM6UPBZiCGcJcHPF4gZn7Bmn6B8oQP"
  );
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const { rpc } = useContext(RpcContext);
  const [counterValue, setCounterValue] = useState<number | undefined>();

  // Load the counter value when the component mounts
  useEffect(() => {
    const loadCounter = async () => {
      try {
        const counterAccount = await fetchCounter(rpc, counterAddress);
        setCounterValue(Number(counterAccount.data.count));
      } catch (e) {
        console.error("Failed to load initial counter value:", e);
      }
    };

    loadCounter();
  }, [counterAddress, rpc]);

  // Render different UI based on wallet connection
  if (!selectedWalletAccount) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-amber-500">
          Please connect and select a wallet to continue
        </p>
        {counterValue !== undefined && (
          <p className="text-2xl font-bold">Current Count: {counterValue}</p>
        )}
        <Button disabled className="opacity-50 cursor-not-allowed w-[150px]">
          Increment Counter
        </Button>
      </div>
    );
  }

  // When we have a wallet, render the inner component that uses the wallet hook
  return (
    <ConnectedCounterButton
      account={selectedWalletAccount}
      counterAddress={counterAddress}
      initialCount={counterValue}
      onCountUpdate={setCounterValue}
    />
  );
}

// Inner component that's only rendered when we have a wallet
function ConnectedCounterButton({
  account,
  counterAddress,
  initialCount,
  onCountUpdate,
}: {
  account: UiWalletAccount;
  counterAddress: Address;
  initialCount?: number;
  onCountUpdate: (count: number) => void;
}) {
  const { current: NO_ERROR } = useRef(Symbol());
  const { rpc, rpcSubscriptions } = useContext(RpcContext);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [error, setError] = useState<unknown>(NO_ERROR);
  const [counterValue, setCounterValue] = useState<number | undefined>(
    initialCount
  );
  const { chain: currentChain } = useContext(ChainContext);

  // Now we can safely use the hook without conditionals
  const transactionSendingSigner = useWalletAccountTransactionSendingSigner(
    account,
    currentChain
  );

  // Update parent when our count changes
  useEffect(() => {
    if (counterValue !== undefined) {
      onCountUpdate(counterValue);
    }
  }, [counterValue, onCountUpdate]);

  // Send transaction to increment the counter
  const handleIncrementCounter = async (): Promise<SignatureBytes> => {
    setError(NO_ERROR);
    setIsSendingTransaction(true);
    try {
      const { value: latestBlockhash } = await rpc
        .getLatestBlockhash({ commitment: "confirmed" })
        .send();

      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayerSigner(transactionSendingSigner, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) =>
          appendTransactionMessageInstruction(
            getIncrementInstruction({
              user: transactionSendingSigner,
              counter: counterAddress,
            }),
            m
          )
      );

      assertIsTransactionMessageWithSingleSendingSigner(message);
      const signature = await signAndSendTransactionMessageWithSigners(message);

      const getRecentSignatureConfirmationPromise =
        createRecentSignatureConfirmationPromiseFactory({
          rpc,
          rpcSubscriptions,
        });

      await getRecentSignatureConfirmationPromise({
        abortSignal: new AbortController().signal,
        commitment: "confirmed",
        signature: getBase58Decoder().decode(signature) as Signature,
      });

      // Update counter value
      const counterAccount = await fetchCounter(rpc, counterAddress);
      setCounterValue(Number(counterAccount.data.count));

      return signature;
    } catch (e) {
      console.error(e);
      setError(e);
      throw e;
    } finally {
      setIsSendingTransaction(false);
    }
  };

  const handleButtonClick = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const signature = await handleIncrementCounter();
      const decodedSignature = getBase58Decoder().decode(signature);
      console.log(decodedSignature);
    } catch (e) {
      // Error is already set in handleIncrementCounter
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 items-center">
        {counterValue !== undefined && (
          <p className="text-2xl font-bold">Count: {counterValue}</p>
        )}

        <Button
          onClick={handleButtonClick}
          disabled={isSendingTransaction}
          className={`w-[150px] mx-auto ${
            isSendingTransaction ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSendingTransaction ? (
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
      </div>
    </div>
  );
}
