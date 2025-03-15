import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("counter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.counter as Program<Counter>;

  // Find the PDA for the counter account
  const [counterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    program.programId
  );

  // Track the last known counter value
  let lastCounterValue = 0;

  it("Creates counter and increments on first call", async () => {
    // Call the increment instruction which should initialize a new counter and increment it
    // Accounts are automatically inferred from the IDL
    const tx = await program.methods.increment().rpc();

    console.log("Your transaction signature", tx);

    // Fetch the newly created counter account
    const counterAccount = await program.account.counter.fetch(counterPDA);
    const currentValue = counterAccount.count.toNumber();

    // Verify that the counter was incremented from 0 to a greater value
    expect(currentValue).to.be.greaterThan(lastCounterValue);
    expect(currentValue - lastCounterValue).to.equal(1);

    // Update last counter value
    lastCounterValue = currentValue;
  });

  it("Increments the counter on subsequent calls", async () => {
    // Call increment again
    const tx = await program.methods.increment().rpc();

    console.log("Your transaction signature", tx);

    // Fetch the counter account
    const counterAccount = await program.account.counter.fetch(counterPDA);
    const currentValue = counterAccount.count.toNumber();

    // Verify that the counter was incremented by 1
    expect(currentValue).to.be.greaterThan(lastCounterValue);
    expect(currentValue - lastCounterValue).to.equal(1);
  });
});
