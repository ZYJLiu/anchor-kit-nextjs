/**
 * Counter module components
 *
 * This module follows a pattern where:
 * - useSolanaCounter: Basic setup hook that provides program and counter address
 * - Each component is responsible for its own data fetching and interaction logic
 *
 * The main SolanaCounter component is exported as default for easy importing.
 */

// Component exports for internal use or advanced customization
export { WalletButton } from "./WalletButton";
export { CounterDisplay } from "./CounterDisplay";
export { IncrementButton } from "./IncrementButton";
export { ToastContent } from "./ToastContent";
export { useSolanaCounter } from "./useSolanaCounter";

// Main component export
export { SolanaCounter as default } from "./SolanaCounter";
