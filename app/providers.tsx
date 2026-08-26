"use client";
import * as React from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/misc";
import { SessionProvider } from "@/lib/session";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StoreProvider>
        <TooltipProvider delayDuration={250}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "!rounded-[10px] !border-line !bg-surface !text-ink !shadow-pop !font-sans",
                description: "!text-ink-3",
                title: "!text-[13.5px] !font-medium",
              },
            }}
          />
        </TooltipProvider>
      </StoreProvider>
    </SessionProvider>
  );
}
