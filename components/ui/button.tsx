"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background,color,box-shadow,border-color] duration-150 disabled:pointer-events-none disabled:opacity-45 select-none active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand-700 text-white shadow-xs hover:bg-brand-800 active:bg-brand-900",
        secondary: "bg-surface text-ink shadow-xs ring-1 ring-line-strong hover:bg-subtle",
        ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
        subtle: "bg-subtle text-ink-2 hover:bg-sunken hover:text-ink",
        danger: "bg-risk-500 text-white shadow-xs hover:bg-risk-700",
        dark: "bg-ink text-white shadow-xs hover:bg-ink-2",
        link: "text-brand-700 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-7 rounded-[6px] px-2 text-[12px] [&_svg]:size-3.5",
        sm: "h-8 rounded-[7px] px-2.5 text-[13px] [&_svg]:size-3.5",
        md: "h-9 rounded-[8px] px-3.5 text-[13.5px] [&_svg]:size-4",
        lg: "h-11 rounded-[10px] px-5 text-[15px] [&_svg]:size-[18px]",
        icon: "size-8 rounded-[7px] [&_svg]:size-4",
        iconSm: "size-7 rounded-[6px] [&_svg]:size-3.5",
      },
      full: { true: "w-full" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(button({ variant, size, full }), className)} {...props} />;
  }
);
Button.displayName = "Button";
export { button as buttonVariants };
