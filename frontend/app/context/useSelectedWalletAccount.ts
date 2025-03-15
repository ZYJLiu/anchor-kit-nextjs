"use client";
import { useContext } from "react";
import { SelectedWalletAccountContext } from "./SelectedWalletAccountContext";

export function useSelectedWalletAccount() {
  return useContext(SelectedWalletAccountContext);
}
