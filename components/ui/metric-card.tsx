import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label, value, delta, deltaLabel, icon, sub, tone = "default", className, footer,
}: {
  label: string; value: React.ReactNode; delta?: number; deltaLabel?: string;
  icon?: React.ReactNode; sub?: string; tone?: "default" | "brand" | "dark";
  className?: string; footer?: React.ReactNode;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 transition-shadow duration-200 hover:shadow-md",
        tone === "dark" ? "border-ink/20 bg-ink text-white" : "border-line bg-surface shadow-xs",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-[12px] font-medium", tone === "dark" ? "text-white/60" : "text-ink-3")}>{label}</p>
        {icon && (
          <span className={cn("flex size-6 items-center justify-center rounded-[7px] [&_svg]:size-3.5",
            tone === "dark" ? "bg-white/10 text-white/70" : "bg-subtle text-ink-4")}>{icon}</span>
        )}
      </div>
      <div className="mt-2.5 flex items-end gap-2">
        <p className={cn("text-[25px] font-semibold leading-none tabular tracking-[-0.02em]", tone === "dark" ? "text-white" : "text-ink")}>{value}</p>
        {delta !== undefined && (
          <span className={cn(
            "mb-0.5 inline-flex items-center gap-0.5 rounded-[5px] px-1 py-0.5 text-[11.5px] font-medium tabular",
            up ? "bg-ok-50 text-ok-700" : "bg-risk-50 text-risk-700",
            tone === "dark" && (up ? "bg-white/10 text-brand-200" : "bg-white/10 text-risk-50")
          )}>
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {(sub || deltaLabel) && (
        <p className={cn("mt-1.5 text-[11.5px]", tone === "dark" ? "text-white/45" : "text-ink-4")}>{sub ?? deltaLabel}</p>
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

export function Stat({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-4">{label}</dt>
      <dd className="mt-1 text-[14px] text-ink">{value}</dd>
    </div>
  );
}

export function ProgressBar({ value, tone = "brand", className, height = "h-1.5" }: {
  value: number; tone?: "brand" | "ok" | "warn" | "risk" | "ink"; className?: string; height?: string;
}) {
  const bg = { brand: "bg-brand-600", ok: "bg-ok-500", warn: "bg-warn-500", risk: "bg-risk-500", ink: "bg-ink" }[tone];
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-sunken", height, className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", bg)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
