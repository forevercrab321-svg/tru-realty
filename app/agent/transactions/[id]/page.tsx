/**
 * Server wrapper: enumerates the seeded records at build time so this route can be
 * statically exported. The interactive body is a client component.
 */
import { transactions } from "@/data/transactions";
import { TransactionDetail } from "@/components/admin/transaction-detail";

export function generateStaticParams() {
  return transactions.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransactionDetail id={id} base="/agent" />;
}
