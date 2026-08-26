import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12.5px] text-ink-4">
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 && <ChevronRight className="size-3 text-ink-4/60" />}
          {it.href ? (
            <Link href={it.href} className="transition-colors hover:text-ink-2">{it.label}</Link>
          ) : (
            <span className="text-ink-2">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function PageHeader({
  title, description, actions, breadcrumb, meta, className, tabs,
}: {
  title: React.ReactNode; description?: string; actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[]; meta?: React.ReactNode;
  className?: string; tabs?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-5", className)}>
      {breadcrumb && <div className="mb-2"><Breadcrumb items={breadcrumb} /></div>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">{description}</p>}
          {meta && <div className="mt-2.5">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
    </div>
  );
}

export function SectionHeader({ title, action, description, className }: {
  title: string; action?: React.ReactNode; description?: string; className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[12.5px] text-ink-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}
