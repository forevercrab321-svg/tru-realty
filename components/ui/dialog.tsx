"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  className, children, size = "md", ...props
}: React.ComponentProps<typeof D.Content> & { size?: "sm" | "md" | "lg" | "xl" }) {
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] data-[state=open]:animate-fade" />
      <D.Content
        className={cn(
          "dialog-content fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-pop outline-none",
          w, className
        )}
        {...props}
      >
        {children}
        <D.Close className="absolute right-3.5 top-3.5 rounded-[6px] p-1 text-ink-4 transition-colors hover:bg-subtle hover:text-ink">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

export function DialogHeader({ title, description, className }: { title: string; description?: string; className?: string }) {
  return (
    <div className={cn("border-b border-line px-5 py-4 pr-12", className)}>
      <D.Title className="text-[15px] font-semibold text-ink">{title}</D.Title>
      {description && <D.Description className="mt-1 text-[13px] leading-relaxed text-ink-3">{description}</D.Description>}
    </div>
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("thin-scrollbar max-h-[60vh] overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-2 border-t border-line bg-canvas px-5 py-3.5", className)} {...props} />;
}

/** Right-side drawer built on the same primitive. */
export function Drawer({ children, ...props }: React.ComponentProps<typeof D.Root>) {
  return <D.Root {...props}>{children}</D.Root>;
}

export function DrawerContent({ className, children, width = "max-w-xl", ...props }: React.ComponentProps<typeof D.Content> & { width?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] data-[state=open]:animate-fade" />
      <D.Content
        className={cn(
          "drawer-content fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-line bg-surface shadow-pop outline-none",
          width, className
        )}
        {...props}
      >
        {children}
        <D.Close className="absolute right-4 top-4 rounded-[6px] p-1 text-ink-4 transition-colors hover:bg-subtle hover:text-ink">
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
export const DrawerTrigger = D.Trigger;
export const DrawerClose = D.Close;
