"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dropdown = M.Root;
export const DropdownTrigger = M.Trigger;

export function DropdownContent({ className, align = "end", sideOffset = 6, ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[190px] overflow-hidden rounded-[10px] border border-line bg-surface p-1 shadow-pop",
          "data-[state=open]:animate-fade", className
        )}
        {...props}
      />
    </M.Portal>
  );
}

export function DropdownItem({ className, destructive, ...props }: React.ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return (
    <M.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-[7px] px-2 py-1.5 text-[13px] text-ink-2 outline-none transition-colors",
        "data-[highlighted]:bg-subtle data-[highlighted]:text-ink [&_svg]:size-3.5 [&_svg]:text-ink-4",
        destructive && "text-risk-500 data-[highlighted]:bg-risk-50 data-[highlighted]:text-risk-700 [&_svg]:text-risk-500",
        className
      )}
      {...props}
    />
  );
}

export function DropdownCheckItem({ className, checked, ...props }: React.ComponentProps<typeof M.CheckboxItem>) {
  return (
    <M.CheckboxItem
      checked={checked}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-[7px] py-1.5 pl-7 pr-2 text-[13px] text-ink-2 outline-none",
        "data-[highlighted]:bg-subtle data-[highlighted]:text-ink relative", className
      )}
      {...props}
    >
      <M.ItemIndicator className="absolute left-2"><Check className="size-3.5" /></M.ItemIndicator>
      {props.children}
    </M.CheckboxItem>
  );
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof M.Label>) {
  return <M.Label className={cn("px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-4", className)} {...props} />;
}

export function DropdownSeparator({ className, ...props }: React.ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn("my-1 h-px bg-line", className)} {...props} />;
}
