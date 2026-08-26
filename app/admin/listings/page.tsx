"use client";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ListingsView } from "@/components/admin/listings-view";
import { useStore } from "@/lib/store";
import { compactUsd, num } from "@/lib/format";
import { sum } from "@/lib/utils";

export default function AdminListings() {
  const { listings } = useStore();
  const onMarket = listings.filter((l) => ["active", "coming_soon"].includes(l.status));
  const inContract = listings.filter((l) => ["under_contract", "pending"].includes(l.status));
  const sold = listings.filter((l) => l.status === "sold");
  const avgDom = Math.round(sum(onMarket, (l) => l.daysOnMarket) / Math.max(1, onMarket.length));

  return (
    <>
      <PageHeader title="Listings" description="Company inventory across every office, with syndication and showing activity." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="On market" value={num(onMarket.length)} sub={`${compactUsd(sum(onMarket, (l) => l.price))} listed`} />
        <MetricCard label="In contract" value={num(inContract.length)} sub={`${compactUsd(sum(inContract, (l) => l.price))} pending`} />
        <MetricCard label="Sold, YTD" value={num(sold.length)} sub={`${compactUsd(sum(sold, (l) => l.price))} closed`} />
        <MetricCard label="Avg. days on market" value={num(avgDom)} sub="Active inventory only" />
      </div>
      <ListingsView rows={listings} base="/admin" />
    </>
  );
}
