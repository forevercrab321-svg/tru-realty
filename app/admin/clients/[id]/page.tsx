/**
 * Server wrapper: enumerates the seeded records at build time so this route can be
 * statically exported. The interactive body is a client component.
 */
import { clients } from "@/data/clients";
import { ClientDetail } from "@/components/admin/client-detail";

export function generateStaticParams() {
  return clients.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetail id={id} base="/admin" />;
}
