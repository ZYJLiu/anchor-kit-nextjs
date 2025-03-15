"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSolanaCounter } from "./useSolanaCounter";
import { toast } from "sonner";
import { ToastContent } from "./ToastContent";

/**
 * IncrementButton component that handles its own transaction logic
 * for incrementing the counter.
 */
export function IncrementButton() {
  // Get program and wallet information from the hook
  const { program, publicKey, connected } = useSolanaCounter();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);

  // Refs for cleanup
  const toastIdRef = useRef<string | number | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup for copy timeout
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Display toast when transaction signature is available
  useEffect(() => {
    if (transactionSignature) {
      const explorerUrl = `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`;

      // Dismiss previous toast if exists
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      // Create toast with custom component that manages its own state
      toastIdRef.current = toast.success("Transaction Sent!", {
        description: (
          <ToastContent
            transactionSignature={transactionSignature}
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
    }
  }, [transactionSignature]);

  // Handle increment button click
  const handleIncrement = async () => {
    if (!publicKey) return;

    try {
      setIsLoading(true);

      // Send the transaction
      const txSignature = await program.methods
        .increment()
        .accounts({
          user: publicKey,
        })
        .rpc();

      setTransactionSignature(txSignature);
    } catch (err) {
      console.error("Error incrementing counter:", err);
      toast.error("Transaction Failed", {
        description: "Could not increment counter. Please try again later.",
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
      onClick={handleIncrement}
      disabled={isLoading || !connected}
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
