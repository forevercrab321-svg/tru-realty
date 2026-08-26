import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Percent } from "lucide-react";
import { PageHero } from "@/components/public/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projects } from "@/data/projects";
import { compactUsd, titleCase } from "@/lib/format";
import { asset } from "@/lib/utils";

export const metadata = { title: "New Development" };

export default function NewDevelopmentPage() {
  return (
    <>
      <PageHero
        eyebrow="New development"
        title="Sponsor projects, represented directly"
        description="Tru holds direct relationships with the sponsors below. That means published commission terms, agent previews before public launch, and buyer registration handled inside our platform instead of over email."
      />

      <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
        <div className="space-y-6">
          {projects.map((p) => (
            <article key={p.id} id={p.id} className="grid overflow-hidden rounded-xl border border-line bg-surface shadow-xs lg:grid-cols-[minmax(0,420px)_1fr]">
              <div className="relative aspect-[16/10] lg:aspect-auto">
                <img src={asset(p.image)} alt={p.name} className="size-full object-cover" />
                <Badge tone="solid" className="absolute left-4 top-4">{titleCase(p.status)}</Badge>
              </div>
              <div className="p-6 lg:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-ink">{p.name}</h2>
                    <p className="mt-1 text-[13.5px] text-ink-3">{p.neighborhood}, {p.city} · Developed by {p.developer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-semibold tabular tracking-[-0.02em] text-ink">
                      {compactUsd(p.priceMin)} – {compactUsd(p.priceMax)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink-4">{p.availableUnits} of {p.totalUnits} available</p>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-2">{p.description}</p>

                <div className="mt-5 overflow-hidden rounded-[10px] border border-line">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line bg-canvas text-left text-[11.5px] uppercase tracking-[0.06em] text-ink-4">
                        <th className="px-3 py-2 font-medium">Residence</th>
                        <th className="px-3 py-2 font-medium">Size</th>
                        <th className="px-3 py-2 font-medium">Price</th>
                        <th className="px-3 py-2 text-right font-medium">Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.unitMix.map((u) => (
                        <tr key={u.type} className="border-b border-line/70 last:border-0 text-[13px] text-ink-2">
                          <td className="px-3 py-2 font-medium text-ink">{u.type}</td>
                          <td className="px-3 py-2 tabular">{u.sqft} sf</td>
                          <td className="px-3 py-2 tabular">{u.price}</td>
                          <td className="px-3 py-2 text-right tabular">{u.available}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-2">
                  <span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-ink-4" />Completion {p.completion}</span>
                  <span className="flex items-center gap-1.5"><Percent className="size-3.5 text-ink-4" />{p.commissionPct}% co-broke</span>
                  {p.bonus && <span className="flex items-center gap-1.5 text-brand-700"><CheckCircle2 className="size-3.5" />{p.bonus}</span>}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button variant="primary" asChild><Link href={`/contact?project=${p.id}`}>Request the offering plan</Link></Button>
                  <Button variant="secondary" asChild><Link href="/agents">Speak with an agent <ArrowRight /></Link></Button>
                </div>

                <p className="mt-5 text-[11.5px] leading-relaxed text-ink-4">
                  Amenities: {p.amenities.join(" · ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
