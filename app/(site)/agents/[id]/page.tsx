import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Building2, Globe, Mail, MapPin, Phone, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/public/cards";
import { agentById, agents } from "@/data/agents";
import { listings } from "@/data/listings";
import { officeById, officeName } from "@/data/offices";
import { compactUsd, dateMed, num, pct, phoneFmt } from "@/lib/format";

export function generateStaticParams() {
  return agents.map((a) => ({ id: a.id }));
}

export default async function AgentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agentById(id);
  if (!agent) notFound();
  const office = officeById(agent.officeId)!;
  const mine = listings.filter((l) => l.listingAgentId === agent.id && !["sold", "withdrawn"].includes(l.status));
  const sold = listings.filter((l) => l.listingAgentId === agent.id && l.status === "sold");

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1280px] px-5 pb-10 pt-32 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={agent.name} size="3xl" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">{agent.name}</h1>
                {agent.tier === "platinum" && <Badge tone="brand"><Award className="size-3" /> Top Producer</Badge>}
              </div>
              <p className="mt-1 text-[15px] text-ink-3">{agent.title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13.5px] text-ink-2">
                <span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-ink-4" />{officeName(agent.officeId)}</span>
                <span className="flex items-center gap-1.5"><Globe className="size-3.5 text-ink-4" />{agent.languages.join(", ")}</span>
                <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-ink-4" />{agent.neighborhoods.slice(0, 3).join(" · ")}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="primary" asChild><Link href={`/contact?agent=${agent.id}`}>Contact {agent.firstName}</Link></Button>
                <Button variant="secondary" asChild><a href={`tel:${agent.phone}`}><Phone /> {phoneFmt(agent.phone)}</a></Button>
                <Button variant="secondary" asChild><a href={`mailto:${agent.email}`}><Mail /> Email</a></Button>
              </div>
            </div>
          </div>

          <dl className="mt-9 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Career sales volume", compactUsd(agent.stats.lifetimeVolume)],
              ["Closings this year", num(agent.stats.ytdClosings)],
              ["List-to-sale ratio", pct(agent.stats.listToSaleRatio)],
              ["Avg. days on market", num(agent.stats.avgDaysOnMarket)],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface px-5 py-4">
                <dt className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{k}</dt>
                <dd className="mt-1 text-[20px] font-semibold tabular tracking-[-0.02em] text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">About {agent.firstName}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{agent.bio}</p>

          <h3 className="mt-8 text-[14px] font-semibold text-ink">Specialties</h3>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {agent.specialties.map((s) => <Badge key={s} tone="neutral" size="lg">{s}</Badge>)}
          </div>

          <h3 className="mt-8 text-[14px] font-semibold text-ink">Neighborhoods</h3>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {agent.neighborhoods.map((s) => <Badge key={s} tone="brand" size="lg">{s}</Badge>)}
          </div>

          <h2 className="mt-12 text-[18px] font-semibold tracking-[-0.02em] text-ink">
            Current listings {mine.length > 0 && <span className="text-ink-4">({mine.length})</span>}
          </h2>
          {mine.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line-strong px-5 py-8 text-center text-[13.5px] text-ink-3">
              {agent.firstName} has no active public listings right now. Reach out about off-market inventory.
            </p>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {mine.map((l) => <PropertyCard key={l.id} listing={l} />)}
            </div>
          )}

          {sold.length > 0 && (
            <>
              <h2 className="mt-12 text-[18px] font-semibold tracking-[-0.02em] text-ink">Recently sold</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {sold.map((l) => <PropertyCard key={l.id} listing={l} />)}
              </div>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-4">Office</p>
            <p className="mt-2 text-[14px] font-medium text-ink">{office.name.replace(" — Headquarters", "")}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{office.street}<br />{office.city}, {office.state} {office.zip}</p>
            <p className="mt-3 text-[13px] text-ink-3">Managing broker · {office.managingBroker}</p>
            <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-ink-4">
              With Tru since {dateMed(agent.joinDate)} · License #{agent.license.number} ({agent.license.state})
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-line bg-brand-900 p-5 text-white">
            <TrendingUp className="size-5 text-brand-300" />
            <p className="mt-3 text-[15px] font-semibold tracking-[-0.015em]">Curious what your home is worth?</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-brand-200">
              {agent.firstName} will put together a comparative market analysis for your building — no obligation.
            </p>
            <Button variant="secondary" full className="mt-4" asChild>
              <Link href={`/contact?intent=valuation&agent=${agent.id}`}>Request a valuation</Link>
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
