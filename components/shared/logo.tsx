import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className, tone = "brand" }: { className?: string; tone?: "brand" | "light" | "dark" }) {
  const bg = tone === "light" ? "#ffffff" : tone === "dark" ? "#16181a" : "#2f4635";
  const fg = tone === "light" ? "#2f4635" : "#ffffff";
  return (
    <svg viewBox="0 0 28 28" className={cn("size-7", className)} aria-hidden>
      <rect width="28" height="28" rx="7.5" fill={bg} />
      <path d="M6.5 14.6 14 8l7.5 6.6" stroke={fg} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95" />
      <path d="M9.6 13.6v6.6h8.8v-6.6" stroke={fg} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      <path d="M14 20.2v-4.1" stroke={fg} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  className, href = "/", tone = "brand", showWord = true, size = "md",
}: { className?: string; href?: string; tone?: "brand" | "light" | "dark"; showWord?: boolean; size?: "sm" | "md" | "lg" }) {
  const text = tone === "light" ? "text-white" : "text-ink";
  const sub = tone === "light" ? "text-white/55" : "text-ink-4";
  const dims = { sm: "size-6", md: "size-7", lg: "size-9" }[size];
  const type = { sm: "text-[14px]", md: "text-[15.5px]", lg: "text-[19px]" }[size];
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2", className)}>
      <LogoMark tone={tone} className={dims} />
      {showWord && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-semibold tracking-[-0.03em]", type, text)}>Tru Realty</span>
          {size === "lg" && <span className={cn("mt-1 text-[10.5px] uppercase tracking-[0.16em]", sub)}>New York</span>}
        </span>
      )}
    </Link>
  );
}
