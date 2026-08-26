import Link from "next/link";
import { ArrowRight, Building2, Compass, HeartHandshake, LineChart, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertySearch } from "@/components/public/property-search";
import { AgentCard, ProjectCard, PropertyCard } from "@/components/public/cards";
import { featuredListings, listings } from "@/data/listings";
import { projects } from "@/data/projects";
import { agents } from "@/data/agents";
import { compactUsd } from "@/lib/format";
import { companyKpis } from "@/data/performance";
import { offices } from "@/data/offices";
import { asset } from "@/lib/utils";

export default function HomePage() {
  const heroListings = featuredListings.slice(0, 6);
  const showcaseAgents = agents.filter((a) => a.status === "active" && a.stats.ytdVolume > 9_000_000).slice(0, 4);

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative isolate min-h-[640px] overflow-hidden lg:min-h-[720px]">
        <img src={asset("/brand/hero.svg")} alt="" aria-hidden className="absolute inset-0 size-full object-cover object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/45 to-ink/85" />
        <div className="relative mx-auto flex min-h-[640px] max-w-[1280px] flex-col justify-center px-5 pb-14 pt-32 sm:px-8 lg:min-h-[720px]">
          <p className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-medium text-white/85 backdrop-blur-sm">
            <Sparkles className="size-3" /> Now serving New York, New Jersey &amp; Connecticut
          </p>
          <h1 className="max-w-3xl text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-white text-balance sm:text-[56px] lg:text-[64px]">
            Real Estate. Built Around You.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[17.5px]">
            A modern brokerage helping agents and clients move with confidence — backed by local expertise
            and a platform that keeps every deal on schedule.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button size="lg" variant="secondary" asChild><Link href="/properties">Find a home</Link></Button>
            <Button size="lg" variant="dark" asChild className="border border-white/15"><Link href="/services#sell">Sell with us</Link></Button>
            <Button size="lg" variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/contact?intent=join">Join Tru Realty <ArrowRight /></Link>
            </Button>
          </div>

          <div className="mt-10 max-w-4xl">
            <PropertySearch />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- METRICS */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-4">
          {[
            { label: "Closed volume, YTD", value: compactUsd(companyKpis.ytdVolume) },
            { label: "Agents & advisors", value: `${companyKpis.totalAgents}` },
            { label: "Offices across the metro", value: `${offices.length}` },
            { label: "Average days on market", value: "44" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[26px] font-semibold tabular tracking-[-0.025em] text-ink sm:text-[30px]">{s.value}</p>
              <p className="mt-1 text-[12.5px] text-ink-3">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- FEATURED LISTINGS */}
      <Section
        eyebrow="Featured"
        title="Homes we're proud to represent"
        description="A cross-section of what Tru agents have on the market right now, from Village townhouses to North Shore estates."
        action={<Button variant="secondary" asChild><Link href="/properties">Browse all {listings.length} listings <ArrowRight /></Link></Button>}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {heroListings.map((l) => <PropertyCard key={l.id} listing={l} />)}
        </div>
      </Section>

      {/* -------------------------------------------------------------- AGENTS */}
      <section className="border-y border-line bg-subtle/40">
        <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-20">
          <Header
            eyebrow="Meet our agents"
            title="People who know the block, not just the borough"
            description="Every Tru agent works a defined set of neighborhoods. That is how you get an honest read on price, timing and what a building will actually approve."
            action={<Button variant="secondary" asChild><Link href="/agents">View the full team <ArrowRight /></Link></Button>}
          />
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {showcaseAgents.map((a) => <AgentCard key={a.id} agent={a} />)}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- NEW DEVELOPMENT */}
      <Section
        eyebrow="New development"
        title="Sponsor projects we represent"
        description="Direct sponsor relationships, published commission terms, and buyer registration handled inside our platform."
        action={<Button variant="secondary" asChild><Link href="/new-development">All projects <ArrowRight /></Link></Button>}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </Section>

      {/* ------------------------------------------------------------ WHY TRU */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-20">
          <Header eyebrow="Why Tru Realty" title="A brokerage that behaves like a product team" />
          <div className="mt-9 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Compass />, title: "Local expertise", body: "Agents are assigned to neighborhoods, not territories drawn on a map. Pricing advice comes from people who have sat in the building's board meeting." },
              { icon: <LineChart />, title: "Modern technology", body: "One platform runs the whole deal — CRM, transaction milestones, documents, signatures and commission math — so nothing lives in an inbox." },
              { icon: <HeartHandshake />, title: "Full-service support", body: "A dedicated transaction coordinator is assigned the day a contract is out. Clients get a single timeline they can actually follow." },
              { icon: <Users />, title: "Agent-first economics", body: "Transparent splits, published caps, and a disbursement schedule agents can plan around. No surprise fees at closing." },
            ].map((f) => (
              <div key={f.title}>
                <span className="mb-3.5 flex size-9 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700 [&_svg]:size-[18px]">{f.icon}</span>
                <p className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{f.title}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-3">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ RECRUIT */}
      <section className="bg-brand-900">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-brand-300">Join our brokerage</p>
            <h2 className="text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] text-white text-balance sm:text-[40px]">
              Keep more of what you earn. Spend less of it on admin.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-brand-200">
              Tru agents get a published split, a real transaction coordinator, marketing that is already built,
              and a portal that shows exactly where every dollar of a deal goes.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Button size="lg" variant="secondary" asChild><Link href="/contact?intent=join">Join Tru Realty</Link></Button>
              <Button size="lg" variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/services">Learn about agent benefits <ArrowRight /></Link>
              </Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10">
            {[
              ["80–90%", "Agent split on published plans"],
              ["$24K", "Annual company-dollar cap"],
              ["1:12", "Coordinator-to-agent ratio"],
              ["6 weeks", "Structured launch program"],
            ].map(([v, l]) => (
              <div key={l} className="bg-brand-900 p-5">
                <dt className="text-[24px] font-semibold tabular tracking-[-0.02em] text-white">{v}</dt>
                <dd className="mt-1 text-[12.5px] leading-snug text-brand-200">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="bg-surface">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Thinking about a move?</h2>
            <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-ink-3">
              Tell us what you are trying to do and we will put you with the agent who works that block — usually within a business day.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button size="lg" variant="primary" asChild><Link href="/contact">Contact us</Link></Button>
            <Button size="lg" variant="secondary" asChild><Link href="/contact?intent=valuation"><Building2 /> Get a home valuation</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Header({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="mb-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-brand-600">{eyebrow}</p>
        <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink text-balance sm:text-[34px]">{title}</h2>
        {description && <p className="mt-3 text-[14.5px] leading-relaxed text-ink-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Section({ eyebrow, title, description, action, children }: {
  eyebrow: string; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-20">
      <Header eyebrow={eyebrow} title={title} description={description} action={action} />
      <div className="mt-9">{children}</div>
    </section>
  );
}
