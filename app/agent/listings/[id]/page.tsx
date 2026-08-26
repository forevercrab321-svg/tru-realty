/**
 * Server wrapper: enumerates the seeded records at build time so this route can be
 * statically exported. The interactive body is a client component.
 */
import { listings } from "@/data/listings";
import { ListingDetail } from "@/components/admin/listing-detail";

export function generateStaticParams() {
  return listings.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail id={id} base="/agent" />;
}
