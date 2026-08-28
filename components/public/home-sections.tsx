"use client";
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Banknote, Building2, CalendarCheck, ClipboardCheck,
  FileSignature, Home, LayoutDashboard, LineChart, LogIn, Search, Sparkles, UserPlus, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookTourDialog } from "./book-tour";
import { neighborhoods } from "@/data/neighborhoods";
import { compactUsd, num } from "@/lib/format";
import { asset, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ ROUTER */

/**
 * Three doors, one band.
 *
 * A brokerage homepage serves three people who want completely different things, and the
 * usual mistake is to design for the buyer and bury the other two in the footer. Each door
 * states who it is for, what is behind it, and gives one unmistakable action.
 */
export function AudienceRouter() {
  const doors = [
    {
      key: "client",
      eyebrow: "Buying or selling",
      title: "Find your place in New York",
      body: "Search live inventory across Manhattan, Brooklyn, Queens and Long Island — then book a tour with the agent who works that block.",
      icon: <Home />,
      tone: "surface" as const,
      primary: <BookTourDialog trigger={<Button variant="primary" full size="lg"><CalendarCheck /> Book a tour</Button>} />,
      secondary: { label: "Browse homes", href: "/properties" },
      points: ["Same-day tours", "Off-market inventory", "No-pressure valuations"],
    },
    {
      key: "recruit",
      eyebrow: "Thinking about a move",
      title: "Join as an agent",
      body: "Published splits, a hard company-dollar cap, a real transaction coordinator, and the platform on this page — not a promise of one.",
      icon: <UserPlus />,
      tone: "dark" as const,
      primary: <Button variant="secondary" full size="lg" asChild><Link href="/contact?intent=join">Join as Agent <ArrowRight /></Link></Button>,
      secondary: { label: "See agent benefits", href: "/services#agents" },
      points: ["80–90% splits", "$24K annual cap", "6-week launch program"],
    },
    {
      key: "agent",
      eyebrow: "Already with Tru",
      title: "Agent & staff console",
      body: "Agents: your deals, clients, listings, commission and payouts. Operations, HR and accounting: the back office. Same door — your account decides where it opens.",
      icon: <LayoutDashboard />,
      tone: "brand" as const,
      primary: <Button variant="primary" full size="lg" asChild><Link href="/login"><LogIn /> Open the console</Link></Button>,
      secondary: { label: "Back office for staff", href: "/login" },
      points: ["Pipeline & transactions", "Commission detail", "Library & training"],
    },
  ];

  return (
    <section className="relative z-10 mx-auto -mt-20 max-w-[1280px] px-5 sm:px-8">
      <div className="grid gap-4 lg:grid-cols-3">
        {doors.map((d) => (
          <div
            key={d.key}
            className={cn(
              "flex flex-col rounded-2xl border p-6 shadow-lg transition-transform duration-300 hover:-translate-y-1",
              d.tone === "dark" && "border-ink/20 bg-ink text-white",
              d.tone === "brand" && "border-brand-800 bg-brand-900 text-white",
              d.tone === "surface" && "border-line bg-surface"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-[10px] [&_svg]:size-[18px]",
                  d.tone === "surface" ? "bg-brand-50 text-brand-700" : "bg-white/10 text-white"
                )}
              >
                {d.icon}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-[0.12em]",
                  d.tone === "surface" ? "text-ink-2" : "text-white/70"
                )}
              >
                {d.eyebrow}
              </span>
            </div>

            <h3
              className={cn(
                "mt-4 text-[20px] font-semibold leading-tight tracking-[-0.02em]",
                d.tone === "surface" ? "text-ink" : "text-white"
              )}
            >
              {d.title}
            </h3>
            <p
              className={cn(
                "mt-2 text-[13.5px] leading-relaxed",
                d.tone === "surface" ? "text-ink-3" : "text-white/65"
              )}
            >
              {d.body}
            </p>

            <ul className="mt-4 space-y-1.5">
              {d.points.map((p) => (
                <li
                  key={p}
                  className={cn(
                    "flex items-center gap-2 text-[12.5px]",
                    d.tone === "surface" ? "text-ink-2" : "text-white/70"
                  )}
                >
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      d.tone === "surface" ? "bg-brand-500" : "bg-white/40"
                    )}
                  />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex-1" />
            <div className="space-y-2">
              {d.primary}
              <Link
                href={d.secondary.href}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 text-[12.5px] transition-colors",
                  d.tone === "surface"
                    ? "text-ink-3 hover:text-ink"
                    : "text-white/50 hover:text-white"
                )}
              >
                {d.secondary.label} <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- NEIGHBORHOODS */

export function NeighborhoodGuides() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {neighborhoods.map((n) => (
        <Link
          key={n.slug}
          href={`/properties?q=${encodeURIComponent(n.name.split(" & ")[0])}`}
          className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-xl border border-line shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <img
            src={asset(n.image)}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/45 to-ink/10" />
          <div className="relative p-5">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
              {n.borough}
            </span>
            <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.02em] text-white">{n.name}</h3>
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/70">{n.blurb}</p>
            <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/15 pt-3 text-[12px] text-white/60">
              {n.listingCount > 0 ? (
                <>
                  <span className="tabular text-white/85">{num(n.listingCount)} available</span>
                  <span className="tabular">
                    from {compactUsd(n.priceFrom)}
                  </span>
                </>
              ) : (
                <span>Ask about off-market inventory</span>
              )}
              {n.agentCount > 0 && <span>{n.agentCount} specialists</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* -------------------------------------------------------- PLATFORM SHOWCASE */

/**
 * The section a traditional brokerage site has no equivalent of. Elliman sells listings;
 * this sells the operating layer, which is the actual reason an agent moves firms.
 */
export function PlatformShowcase() {
  const modules = [
    { icon: <LineChart />, name: "Pipeline", body: "Recruiting, onboarding and every live transaction on one board. Drag a card, the stage moves." },
    { icon: <FileSignature />, name: "Transactions", body: "One file per deal — milestones, documents, tasks, compliance and commission in the same place." },
    { icon: <Banknote />, name: "Commission", body: "Every split, cap, team override and fee calculated the same way, visible before closing." },
    { icon: <Users />, name: "Agents & HR", body: "Licensing, MLS status, onboarding checklists, training and agreements without a spreadsheet." },
    { icon: <Building2 />, name: "Listings", body: "Inventory, syndication status, open houses and showing activity across every office." },
    { icon: <ClipboardCheck />, name: "Accounting", body: "Disbursements, agent billing, payouts and 1099s reconciled to the transaction ledger." },
  ];

  return (
    <section className="pane-dark border-y border-white/10">
      <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-brand-300">
              The platform
            </p>
            <h2 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.028em] text-white text-balance sm:text-[38px]">
              Most brokerages hand you nine logins. We built one.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/75">
              CRM, transaction management, e-signature, commission, accounting, training and
              events — the same system our agents work in every day, not a portal bolted on
              after the fact.
            </p>
          </div>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/login">
              <LayoutDashboard /> See it live
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div key={m.name}>
              <span className="mb-3.5 flex size-9 items-center justify-center rounded-[10px] bg-white/12 text-brand-200 [&_svg]:size-[18px]">
                {m.icon}
              </span>
              <p className="text-[15px] font-semibold tracking-[-0.015em] text-white">{m.name}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">{m.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-7">
          <p className="text-[12.5px] text-white/55">
            Sign in with any demo account to walk the whole system:
          </p>
          {[
            ["admin@trurealty.com", "Back office"],
            ["agent@trurealty.com", "Agent portal"],
          ].map(([email, role]) => (
            <span key={email} className="flex items-center gap-2 text-[12.5px]">
              <code className="rounded-[5px] bg-white/12 px-1.5 py-0.5 font-mono text-white/80">
                {email}
              </code>
              <span className="text-white/55">{role}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- STAT STRIP */

export function StatStrip({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="pane-lifted rounded-2xl border border-line/70 shadow-[0_1px_40px_rgba(12,16,20,0.10)]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-8 px-5 py-9 sm:px-8 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[26px] font-semibold tabular tracking-[-0.025em] text-ink sm:text-[30px]">
              {s.value}
            </p>
            <p className="mt-1 text-[12.5px] text-ink-2">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- SECTION HDR */

export function SectionHead({
  eyebrow, title, description, action,
}: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="mb-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-brand-600">{eyebrow}</p>
        <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink text-balance sm:text-[34px]">
          {title}
        </h2>
        {description && <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}
