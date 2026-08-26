/**
 * Server wrapper: enumerates the seeded records at build time so this route can be
 * statically exported. The interactive body is a client component.
 */
import { events } from "@/data/events";
import { EventDetail } from "@/components/admin/event-detail";

export function generateStaticParams() {
  return events.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetail id={id} base="/admin" />;
}
