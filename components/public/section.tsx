import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow, title, description, children, className, compact,
}: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <section className={cn("border-b border-line bg-surface", className)}>
      <div className={cn("mx-auto max-w-[1280px] px-5 sm:px-8", compact ? "pb-8 pt-28" : "pb-12 pt-32 lg:pb-16 lg:pt-36")}>
        {eyebrow && <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-brand-600">{eyebrow}</p>}
        <h1 className="max-w-3xl text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink text-balance sm:text-[42px]">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-3">{description}</p>}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}
