/**
 * Server wrapper: enumerates the seeded records at build time so this route can be
 * statically exported. The interactive body is a client component.
 */
import { agents } from "@/data/agents";
import { AgentProfile } from "@/components/admin/agent-profile";

export function generateStaticParams() {
  return agents.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgentProfile id={id} />;
}
