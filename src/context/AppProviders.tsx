"use client";

import { StoreProvider } from "@/context/StoreContext";
import { ToastNotification } from "@/components/ToastNotification";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {children}
      <ToastNotification />
    </StoreProvider>
  );
}
