import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function groupBy<T, K extends string>(arr: T[], key: (t: T) => K) {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

export function sum<T>(arr: T[], fn: (t: T) => number) {
  return arr.reduce((a, b) => a + fn(b), 0);
}

export function sortBy<T>(arr: T[], fn: (t: T) => number | string, dir: "asc" | "desc" = "asc") {
  return [...arr].sort((a, b) => {
    const av = fn(a), bv = fn(b);
    const r = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? r : -r;
  });
}

export function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Resolve a path under /public for the current deployment.
 *
 * `basePath` in next.config rewrites next/link and next/image, but NOT a plain
 * `<img src>` or a CSS url(). Every reference to a file in /public goes through
 * here so the same build works at a root domain and on a GitHub Pages subpath.
 */
export function asset(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return path.startsWith("/") ? `${base}${path}` : path;
}
