"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WalletButton } from "./WalletButton";
import { CounterDisplay } from "./CounterDisplay";
import { IncrementButton } from "./IncrementButton";

/**
 * SolanaCounter is the main component for the Counter dApp.
 * It provides a user interface for interacting with a Solana counter program.
 *
 * In this refactored version, each component is responsible for its own
 * functionality:
 * - WalletConnectSection: Handles wallet connection UI
 * - CounterDisplay: Fetches and displays the counter value
 * - IncrementButton: Handles transactions to increment the counter
 */
export function SolanaCounter() {
  return (
    <Card className="w-[350px] mx-auto border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl shadow-purple-900/10">
      <CardContent className="flex flex-col items-center py-6 space-y-6">
        <WalletButton />
        <CounterDisplay />
        <IncrementButton />
      </CardContent>
    </Card>
  );
}
