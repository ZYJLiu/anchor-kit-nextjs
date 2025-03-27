"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WalletButton } from "./WalletButton";
import { CounterButton } from "./CounterButton";

/**
 * SolanaCounter is the main component for the Counter dApp.
 * It provides a user interface for interacting with a Solana counter program.
 *
 * This version uses the ModernCounterButton component which combines the
 * counter display and increment functionality in one component.
 */
export default function CounterCard() {
  return (
    <Card className="w-[350px] mx-auto border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl shadow-purple-900/10">
      <CardContent className="flex flex-col items-center py-6 space-y-6">
        <WalletButton />
        <CounterButton />
      </CardContent>
    </Card>
  );
}
