"use client";
import * as React from "react";
import { Search, Users } from "lucide-react";
import { PageHero } from "@/components/public/section";
import { AgentCard } from "@/components/public/cards";
import { Input, NativeSelect } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { agents } from "@/data/agents";
import { offices } from "@/data/offices";
import { unique } from "@/lib/utils";
import Link from "next/link";

export default function AgentsPage() {
  const [q, setQ] = React.useState("");
  const [office, setOffice] = React.useState("");
  const [lang, setLang] = React.useState("");
  const [hood, setHood] = React.useState("");

  const languages = unique(agents.flatMap((a) => a.languages)).sort();
  const hoods = unique(agents.flatMap((a) => a.neighborhoods)).sort();

  const rows = agents
    .filter((a) => a.status === "active")
    .filter((a) => !q || `${a.name} ${a.title} ${a.neighborhoods.join(" ")} ${a.specialties.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
    .filter((a) => !office || a.officeId === office)
    .filter((a) => !lang || a.languages.includes(lang))
    .filter((a) => !hood || a.neighborhoods.includes(hood))
    .sort((a, b) => b.stats.lifetimeVolume - a.stats.lifetimeVolume);

  return (
    <>
      <PageHero
        eyebrow="Our team"
        title="Agents who work the block"
        description="Search by neighborhood, language or specialty. Every Tru agent is licensed in New York and backed by a dedicated transaction coordinator."
        compact
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input icon={<Search />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, neighborhood or specialty" className="h-10 sm:max-w-[300px]" />
          <NativeSelect value={office} onChange={(e) => setOffice(e.target.value)} className="h-10 sm:w-[190px]">
            <option value="">All offices</option>
            {offices.map((o) => <option key={o.id} value={o.id}>{o.name.replace(" — Headquarters", "")}</option>)}
          </NativeSelect>
          <NativeSelect value={hood} onChange={(e) => setHood(e.target.value)} className="h-10 sm:w-[190px]">
            <option value="">All neighborhoods</option>
            {hoods.map((h) => <option key={h} value={h}>{h}</option>)}
          </NativeSelect>
          <NativeSelect value={lang} onChange={(e) => setLang(e.target.value)} className="h-10 sm:w-[160px]">
            <option value="">Any language</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </NativeSelect>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
        <p className="mb-5 text-[14px] text-ink-2">
          <span className="font-semibold text-ink tabular">{rows.length}</span> {rows.length === 1 ? "agent" : "agents"}
        </p>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No agents match that search"
            description="Try a different neighborhood or clear the filters — we may still have someone who covers the area."
            action={<Button variant="secondary" onClick={() => { setQ(""); setOffice(""); setLang(""); setHood(""); }}>Clear filters</Button>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((a) => <AgentCard key={a.id} agent={a} />)}
          </div>
        )}

        <div className="mt-14 flex flex-col items-start gap-4 rounded-xl border border-line bg-surface p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">Thinking about joining us?</h2>
            <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-3">
              We hire a small number of agents each quarter and give each one a real onboarding program, published economics and a coordinator from day one.
            </p>
          </div>
          <Button variant="primary" size="lg" asChild><Link href="/contact?intent=join">Join Tru Realty</Link></Button>
        </div>
      </div>
    </>
  );
}
