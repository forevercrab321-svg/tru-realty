"use client";
import * as React from "react";
import * as TP from "@radix-ui/react-tooltip";
import * as PO from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export const TooltipProvider = TP.Provider;

export function Tooltip({ children, content, side = "top" }: {
  children: React.ReactNode; content: React.ReactNode; side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TP.Root delayDuration={250}>
      <TP.Trigger asChild>{children}</TP.Trigger>
      <TP.Portal>
        <TP.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-[240px] rounded-[7px] bg-ink px-2 py-1 text-[12px] leading-snug text-white shadow-lg data-[state=delayed-open]:animate-fade"
        >
          {content}
        </TP.Content>
      </TP.Portal>
    </TP.Root>
  );
}

export const Popover = PO.Root;
export const PopoverTrigger = PO.Trigger;
export function PopoverContent({ className, align = "start", sideOffset = 6, ...props }: React.ComponentProps<typeof PO.Content>) {
  return (
    <PO.Portal>
      <PO.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("z-50 rounded-[10px] border border-line bg-surface p-3 shadow-pop outline-none data-[state=open]:animate-fade", className)}
        {...props}
      />
    </PO.Portal>
  );
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? "h-full w-px" : "h-px w-full", "bg-line", className)} />;
}

export function KeyHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-line-strong bg-subtle px-1 font-sans text-[10.5px] font-medium text-ink-4">
      {children}
    </kbd>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-[18px] w-8 shrink-0 rounded-full transition-colors", checked ? "bg-brand-600" : "bg-line-strong")}
    >
      <span className={cn("absolute top-0.5 size-[14px] rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-[16px]" : "translate-x-0.5")} />
    </button>
  );
}
