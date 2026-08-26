"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-[8px] border border-line-strong bg-surface px-3 text-[13.5px] text-ink placeholder:text-ink-4 shadow-xs outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 disabled:bg-subtle disabled:text-ink-3";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }>(
  ({ className, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 [&_svg]:size-4">{icon}</span>
          <input ref={ref} className={cn(base, "h-9 pl-9", className)} {...props} />
        </div>
      );
    }
    return <input ref={ref} className={cn(base, "h-9", className)} {...props} />;
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, "min-h-[84px] resize-y py-2 leading-relaxed", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(base, "h-9 cursor-pointer appearance-none pr-8", className)}
        {...props}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" viewBox="0 0 16 16" fill="none">
        <path d="M4 6.5 8 10l4-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
);
NativeSelect.displayName = "NativeSelect";

export function Label({ className, children, hint, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string }) {
  return (
    <label className={cn("mb-1.5 flex items-baseline justify-between text-[12.5px] font-medium text-ink-2", className)} {...props}>
      <span>{children}</span>
      {hint && <span className="text-[11.5px] font-normal text-ink-4">{hint}</span>}
    </label>
  );
}

export function Field({ label, hint, error, children, className }: {
  label?: string; hint?: string; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      {label && <Label hint={hint}>{label}</Label>}
      {children}
      {error && <p className="mt-1 text-[12px] text-risk-500">{error}</p>}
    </div>
  );
}
