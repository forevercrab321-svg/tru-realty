/** Presentation formatters. All money is USD, all dates render in the office timezone. */

export const usd = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, ...opts }).format(n || 0);

export const usdCents = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);

export function compactUsd(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return usd(n);
}

export const num = (n: number) => new Intl.NumberFormat("en-US").format(n || 0);
export const pct = (n: number, d = 1) => `${(n ?? 0).toFixed(d)}%`;

export function dateShort(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00" : "")) : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function dateMed(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00" : "")) : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function dateLong(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00" : "")) : d;
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** Fixed "today" so the seeded demo always reads consistently. */
export const TODAY = new Date("2026-08-26T12:00:00");

export function daysUntil(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00" : "")) : d;
  return Math.round((dt.getTime() - TODAY.getTime()) / 86_400_000);
}

export function relative(d: string | Date) {
  const days = daysUntil(d);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0 && days > -30) return `${-days} days ago`;
  if (days > 0 && days < 30) return `in ${days} days`;
  return dateMed(d);
}

export function timeRange(start: string, end: string) {
  return `${start} – ${end}`;
}

export function phoneFmt(p: string) {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

export function fileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
