"use client";
import * as React from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/misc";
import { SessionProvider } from "@/lib/session";
import { StoreProvider } from "@/lib/store";
import { Assistant } from "@/components/ai/assistant";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StoreProvider>
        <TooltipProvider delayDuration={250}>
          {children}
          {/* Mounted once. Which assistant appears — and whether one appears at all —
              is decided by the route and the session, inside the component. */}
          <Assistant />
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
