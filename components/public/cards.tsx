import Link from "next/link";
import { Bath, BedDouble, MapPin, Maximize, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { compactUsd, num, usd } from "@/lib/format";
import { LISTING_STATUS_LABEL } from "@/data/listings";
import { agentById } from "@/data/agents";
import { officeName } from "@/data/offices";
import type { Agent, Listing, Project } from "@/types";
import { cn, asset } from "@/lib/utils";

export function PropertyCard({ listing, href, className }: { listing: Listing; href?: string; className?: string }) {
  const agent = agentById(listing.listingAgentId);
  const reduced = listing.price < listing.originalPrice;
  return (
    <Link
      href={href ?? `/properties/${listing.id}`}
      className={cn("group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg", className)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        <img
          src={asset(listing.images[0])}
          alt={`${listing.address}, ${listing.city}`}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone={listing.status === "active" ? "solid" : listing.status === "coming_soon" ? "plum" : "neutral"} size="sm" className="backdrop-blur-sm">
            {LISTING_STATUS_LABEL[listing.status]}
          </Badge>
          {reduced && <Badge tone="risk" size="sm">Price improved</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[18px] font-semibold tabular tracking-[-0.02em] text-ink">{usd(listing.price)}</p>
          <span className="text-[11.5px] text-ink-4">{listing.propertyType}</span>
        </div>
        <p className="mt-1 truncate text-[13.5px] font-medium text-ink-2">
          {listing.address}{listing.unit ? `, ${listing.unit}` : ""}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-3">
          <MapPin className="size-3" /> {listing.neighborhood === listing.city ? listing.city : `${listing.neighborhood}, ${listing.city}`}
        </p>
        <div className="mt-3 flex items-center gap-3.5 border-t border-line pt-3 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1"><BedDouble className="size-3.5 text-ink-4" />{listing.beds} bd</span>
          <span className="flex items-center gap-1"><Bath className="size-3.5 text-ink-4" />{listing.baths}{listing.halfBaths ? `.5` : ""} ba</span>
          <span className="flex items-center gap-1"><Maximize className="size-3.5 text-ink-4" />{num(listing.sqft)} sf</span>
        </div>
        {agent && (
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <Avatar name={agent.name} size="sm" />
            <span className="truncate text-[12px] text-ink-3">Listed by <span className="text-ink-2">{agent.name}</span></span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-50/80 to-transparent" />
      <div className="relative flex items-start gap-3">
        <Avatar name={agent.name} size="xl" className="ring-2 ring-surface" />
        <div className="min-w-0 pt-1">
          <p className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-ink">{agent.name}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{agent.title}</p>
        </div>
      </div>

      <p className="relative mt-4 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{agent.bio}</p>

      <div className="relative mt-4 flex flex-wrap gap-1">
        {agent.neighborhoods.slice(0, 3).map((n) => (
          <span key={n} className="rounded-[5px] bg-subtle px-1.5 py-0.5 text-[11.5px] text-ink-3">{n}</span>
        ))}
      </div>

      <dl className="relative mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5">
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.07em] text-ink-4">Volume</dt>
          <dd className="mt-0.5 text-[13px] font-medium tabular text-ink">{compactUsd(agent.stats.lifetimeVolume)}</dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.07em] text-ink-4">Office</dt>
          <dd className="mt-0.5 truncate text-[13px] text-ink-2">{officeName(agent.officeId)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10.5px] uppercase tracking-[0.07em] text-ink-4">Speaks</dt>
          <dd className="mt-0.5 truncate text-[13px] text-ink-2">{agent.languages.join(", ")}</dd>
        </div>
      </dl>
    </Link>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/new-development#${project.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sunken">
        <img src={asset(project.image)} alt={project.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
        <Badge tone="solid" size="sm" className="absolute left-3 top-3">{project.status.replace(/_/g, " ")}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{project.name}</p>
          <ArrowUpRight className="size-4 shrink-0 text-ink-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-3">{project.neighborhood}, {project.city} · {project.developer}</p>
        <p className="mt-3 text-[13.5px] font-medium tabular text-ink">
          {compactUsd(project.priceMin)} – {compactUsd(project.priceMax)}
        </p>
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-3 text-[12px] text-ink-3">
          <span>{project.availableUnits} available</span>
          <span className="text-ink-4">·</span>
          <span>{project.completion}</span>
        </div>
      </div>
    </Link>
  );
}
