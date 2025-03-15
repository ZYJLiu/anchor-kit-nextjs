"use client";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Counter } from "@/lib/program-idl/idl";
import Idl from "@/lib/program-idl/idl.json";
import { PublicKey } from "@solana/web3.js";

// Simplified interface for the hook
interface UseSolanaCounterReturn {
  program: anchor.Program<Counter>;
  counterAddress: PublicKey;
  publicKey: PublicKey | null;
  connected: boolean;
  connection: anchor.web3.Connection;
}

/**
 * A simplified hook that provides access to the Solana program and counter address.
 * This hook only handles the basic setup and doesn't manage state or interactions.
 */
export function useSolanaCounter(): UseSolanaCounterReturn {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  // Program initialization - conditionally create with provider if wallet connected
  let program;
  if (wallet) {
    // Create a provider with the wallet for transaction signing capability
    const provider = new anchor.AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
    program = new anchor.Program<Counter>(Idl, provider);
  } else {
    // Create program with just connection for read-only operations
    program = new anchor.Program<Counter>(Idl, { connection });
  }

  const counterAddress = PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    new PublicKey(Idl.address)
  )[0];

  return {
    program,
    counterAddress,
    publicKey,
    connected,
    connection,
  };
}
