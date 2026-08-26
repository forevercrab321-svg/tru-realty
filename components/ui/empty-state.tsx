import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon, title, description, action, className,
}: {
  icon?: React.ReactNode; title: string; description?: string;
  action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center", className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-[10px] bg-subtle text-ink-4 [&_svg]:size-5">
        {icon ?? (
          <svg viewBox="0 0 20 20" fill="none" className="size-5">
            <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5v-7Z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3 9h14" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        )}
      </div>
      <p className="text-[13.5px] font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
