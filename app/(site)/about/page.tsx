import Link from "next/link";
import { PageHero } from "@/components/public/section";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { company, offices } from "@/data/offices";
import { companyKpis } from "@/data/performance";
import { compactUsd } from "@/lib/format";

export const metadata = { title: "About" };

const LEADERSHIP = [
  { name: "Grace Whitfield", title: "Principal Broker & Co-Founder", bio: "Twenty-two years in New York brokerage, previously running a 180-agent Manhattan region. Grace holds the license and sets compliance policy." },
  { name: "Andre Okafor", title: "Director of Brokerage Operations", bio: "Built the operating model Tru runs on today — from the coordinator ratio to the Wednesday disbursement schedule." },
  { name: "Simone Bell", title: "Director of Agent Experience", bio: "Owns recruiting, onboarding and training. Designed the six-week Launch program every new Tru agent goes through." },
  { name: "Ruben Navarro", title: "Controller", bio: "Runs commission accounting, agent billing and 1099 reporting. Every split in the platform reconciles to his ledger." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Tru Realty"
        title="We started Tru because the tools were the problem"
        description="Agents were doing good work inside nine disconnected systems. Tru Realty is a brokerage and a platform built together, so the operating layer actually helps the people closing the deals."
      />

      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-ink">How we work</h2>
            <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-ink-2">
              <p>
                Tru Realty opened in {company.founded} with one office in the Flatiron District and a simple thesis: a brokerage
                should be judged by what it takes off an agent&apos;s plate, not by how many logos are in the lobby.
              </p>
              <p>
                We hire deliberately. Agents work defined neighborhoods, get a transaction coordinator assigned the day a
                contract goes out, and see exactly how every commission is calculated — before closing, not after.
              </p>
              <p>
                Today {companyKpis.totalAgents} agents work out of {offices.length} offices across the New York metro,
                and the platform they use is the same one you are looking at.
              </p>
            </div>
          </div>
          <dl className="grid gap-px self-start overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {[
              ["Founded", String(company.founded)],
              ["Closed volume, YTD", compactUsd(companyKpis.ytdVolume)],
              ["Licensed in", company.states.join(", ")],
              ["MLS boards", company.mlsBoards.join(", ")],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface px-5 py-4">
                <dt className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{k}</dt>
                <dd className="mt-1 text-[15px] font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-line bg-subtle/40">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-ink">Leadership</h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERSHIP.map((p) => (
              <div key={p.name} className="rounded-xl border border-line bg-surface p-5">
                <Avatar name={p.name} size="xl" />
                <p className="mt-3 text-[15px] font-semibold tracking-[-0.015em] text-ink">{p.name}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-3">{p.title}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{p.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-ink">Offices</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {offices.map((o) => (
              <div key={o.id} className="rounded-xl border border-line bg-canvas p-5">
                <p className="text-[15px] font-semibold text-ink">{o.name.replace(" — Headquarters", "")}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{o.street}<br />{o.city}, {o.state} {o.zip}</p>
                <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-ink-3">Managing broker · {o.managingBroker}</p>
                <p className="mt-1 text-[12.5px] text-ink-4">{o.agentCount} agents · opened {new Date(o.opened).getFullYear()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
          <h2 className="text-[16px] font-semibold text-ink">Fair housing &amp; standard operating procedures</h2>
          <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-ink-3">
            Tru Realty is committed to the letter and spirit of United States policy for the achievement of equal housing
            opportunity. We do not require prospective buyers to show identification, sign an exclusive brokerage agreement,
            or provide a pre-approval before an initial showing, except where a specific building or seller requires it.
            Our full standard operating procedures are available on request from any office.
          </p>
          <Button variant="secondary" className="mt-5" asChild><Link href="/contact">Request our SOP</Link></Button>
        </div>
      </section>
    </>
  );
}
