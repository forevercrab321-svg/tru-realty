import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bath, BedDouble, Building, CalendarDays, Car, Eye, Heart, MapPin, Maximize, Share2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PropertyCard } from "@/components/public/cards";
import { LISTING_STATUS_LABEL, listingById, listings } from "@/data/listings";
import { agentById } from "@/data/agents";
import { officeName } from "@/data/offices";
import { dateMed, num, phoneFmt, usd } from "@/lib/format";
import { asset } from "@/lib/utils";

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = listingById(id);
  if (!listing) notFound();
  const agent = agentById(listing.listingAgentId)!;
  const similar = listings
    .filter((l) => l.id !== listing.id && l.propertyType === listing.propertyType && l.status !== "sold")
    .slice(0, 3);

  const ppsf = Math.round(listing.price / listing.sqft);

  return (
    <>
      <div className="pt-[68px]" />

      {/* Gallery */}
      <section className="mx-auto max-w-[1280px] px-5 pt-6 sm:px-8">
        <div className="grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:h-[420px] lg:h-[480px]">
          <img
            src={asset(listing.images[0])}
            alt={listing.address}
            className="col-span-4 row-span-2 size-full object-cover sm:col-span-2"
          />
          <img src={asset(listing.images[1])} alt="" className="hidden size-full object-cover sm:col-span-2 sm:block" />
          <img src={asset(listing.images[2])} alt="" className="hidden size-full object-cover sm:block" />
          <div className="relative hidden sm:block">
            <img src={asset(listing.images[0])} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[13px] font-medium text-white">
              + 14 photos
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={listing.status === "active" ? "ok" : "neutral"} dot>{LISTING_STATUS_LABEL[listing.status]}</Badge>
                <span className="text-[12.5px] text-ink-4">MLS #{listing.mlsId}</span>
                <span className="text-[12.5px] text-ink-4">· {listing.daysOnMarket} days on market</span>
              </div>
              <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-ink">
                {listing.address}{listing.unit ? `, ${listing.unit}` : ""}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink-3">
                <MapPin className="size-3.5" /> {listing.neighborhood}, {listing.city}, {listing.state} {listing.zip}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm"><Heart /> Save</Button>
              <Button variant="secondary" size="sm"><Share2 /> Share</Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-line bg-surface p-5">
            <div>
              <p className="text-[28px] font-semibold tabular tracking-[-0.025em] text-ink">{usd(listing.price)}</p>
              {listing.price < listing.originalPrice && (
                <p className="mt-0.5 text-[12.5px] text-risk-500">Reduced from {usd(listing.originalPrice)}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[14px] text-ink-2">
              <span className="flex items-center gap-1.5"><BedDouble className="size-4 text-ink-4" />{listing.beds} beds</span>
              <span className="flex items-center gap-1.5"><Bath className="size-4 text-ink-4" />{listing.baths}{listing.halfBaths ? ".5" : ""} baths</span>
              <span className="flex items-center gap-1.5"><Maximize className="size-4 text-ink-4" />{num(listing.sqft)} sq ft</span>
              <span className="flex items-center gap-1.5"><Building className="size-4 text-ink-4" />{listing.propertyType}</span>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-[16px] font-semibold text-ink">About this home</h2>
            <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">{listing.description}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-[16px] font-semibold text-ink">Features</h2>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {listing.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13.5px] text-ink-2">
                  <Sparkles className="size-3.5 text-brand-500" /> {f}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-[16px] font-semibold text-ink">Property details</h2>
            <dl className="mt-3 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Property type", listing.propertyType],
                ["Year built", String(listing.yearBuilt)],
                ["Price per sq ft", usd(ppsf)],
                ["Annual taxes", listing.taxes ? usd(listing.taxes) : "Included in maintenance"],
                [listing.hoa ? "Common charges" : "Maintenance", listing.hoa ? `${usd(listing.hoa)}/mo` : "—"],
                ["Lot size", listing.lotSqft ? `${num(listing.lotSqft)} sq ft` : "—"],
                ["Listed on", dateMed(listing.listedOn)],
                ["Days on market", String(listing.daysOnMarket)],
                ["Neighborhood", listing.neighborhood],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface px-4 py-3">
                  <dt className="text-[11.5px] uppercase tracking-[0.06em] text-ink-4">{k}</dt>
                  <dd className="mt-1 text-[13.5px] text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {listing.openHouses.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[16px] font-semibold text-ink">Open houses</h2>
              <div className="mt-3 space-y-2">
                {listing.openHouses.map((oh) => (
                  <div key={oh.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-surface px-4 py-3">
                    <CalendarDays className="size-4 text-ink-4" />
                    <span className="text-[13.5px] font-medium text-ink">{dateMed(oh.date)}</span>
                    <span className="text-[13.5px] text-ink-3">{oh.start} – {oh.end}</span>
                    <span className="text-[12.5px] text-ink-4">{oh.registrations} registered</span>
                    <Button size="sm" variant="secondary" className="ml-auto" asChild>
                      <Link href={`/contact?listing=${listing.id}`}>RSVP</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Agent rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-4">Listed by</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={agent.name} size="xl" />
              <div className="min-w-0">
                <Link href={`/agents/${agent.id}`} className="truncate text-[15px] font-semibold text-ink hover:underline">{agent.name}</Link>
                <p className="mt-0.5 text-[12.5px] text-ink-3">{agent.title}</p>
                <p className="mt-0.5 text-[12px] text-ink-4">{officeName(agent.officeId)} office</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="primary" full asChild><Link href={`/contact?listing=${listing.id}`}>Request a showing</Link></Button>
              <Button variant="secondary" full asChild><a href={`tel:${agent.phone}`}>{phoneFmt(agent.phone)}</a></Button>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-4">
              Typically responds within an hour during business days. Speaks {agent.languages.join(", ")}.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-5 shadow-xs">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-4">Listing activity</p>
            <dl className="mt-3 space-y-2.5">
              {[["Views", num(listing.views)], ["Saves", num(listing.saves)], ["Showings booked", num(listing.showings)], ["Offers received", num(listing.offers)]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-[13px] text-ink-3"><Eye className="size-3.5 text-ink-4" />{k}</dt>
                  <dd className="text-[13px] font-medium tabular text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="border-t border-line bg-subtle/40">
          <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Similar homes</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((l) => <PropertyCard key={l.id} listing={l} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
