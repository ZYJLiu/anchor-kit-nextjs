#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

// Declare the program ID
declare_id!("C8ELYscK1BFKCPyo8cj3NQq5UexGxmAXpJeqsfLhANU4");

#[program]
pub mod counter {
    use super::*;

    // Increment instruction - increases the counter value by 1
    // This uses init_if_needed so the counter will be created if it doesn't exist
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        msg!("Incrementing counter");

        // Get a mutable reference to the counter account
        let counter = &mut ctx.accounts.counter;

        // Always increment the counter value
        counter.count += 1;

        // Log the counter value
        msg!("Counter value: {}", counter.count);

        Ok(())
    }
}

// Account structure for the Increment instruction
#[derive(Accounts)]
pub struct Increment<'info> {
    // The user account that signs the transaction
    #[account(mut)]
    pub user: Signer<'info>,

    // The Counter account to be incremented
    // init_if_needed allows this account to be created if it doesn't exist
    #[account(
        init_if_needed,                                 // Initialize if it doesn't exist
        payer = user,                                   // The user pays for the account creation if needed
        space = Counter::LEN,                           // Use the LEN constant from Counter impl
        seeds = [b"counter"],                           // PDA seed "counter"
        bump                                            // Bump seed for PDA derivation
    )]
    pub counter: Account<'info, Counter>,

    // System program is required for creating accounts
    pub system_program: Program<'info, System>,
}

// Counter account data structure
#[account]
#[derive(InitSpace)]
pub struct Counter {
    // The counter value stored as an unsigned 64-bit integer
    pub count: u64,
}

impl Counter {
    // The length of the account discriminator (8 bytes) and the counter value (8 bytes)
    pub const LEN: usize = Self::DISCRIMINATOR.len() + Self::INIT_SPACE;
}
