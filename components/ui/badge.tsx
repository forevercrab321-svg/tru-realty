import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 font-medium whitespace-nowrap tabular",
  {
    variants: {
      tone: {
        neutral: "bg-subtle text-ink-2 ring-1 ring-line",
        brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
        ok: "bg-ok-50 text-ok-700 ring-1 ring-ok-500/15",
        warn: "bg-warn-50 text-warn-700 ring-1 ring-warn-500/15",
        risk: "bg-risk-50 text-risk-700 ring-1 ring-risk-500/15",
        info: "bg-info-50 text-info-700 ring-1 ring-info-500/15",
        plum: "bg-plum-50 text-plum-500 ring-1 ring-plum-500/15",
        solid: "bg-ink text-white",
        outline: "text-ink-2 ring-1 ring-line-strong",
      },
      size: {
        sm: "h-5 rounded-[5px] px-1.5 text-[11px]",
        md: "h-6 rounded-[6px] px-2 text-[12px]",
        lg: "h-7 rounded-[7px] px-2.5 text-[13px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {
  dot?: boolean;
}

export function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone, size }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
