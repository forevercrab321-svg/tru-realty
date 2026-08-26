"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Building2, CalendarDays, Contact, FileSignature, Users, BookMarked, Search,
  LayoutDashboard, Blocks, Banknote, ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { KeyHint } from "@/components/ui/misc";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { agents } from "@/data/agents";
import { compactUsd } from "@/lib/format";

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const { account } = useSession();
  const store = useStore();
  const base = account?.portal === "agent" ? "/agent" : "/admin";
  const isAgent = account?.portal === "agent";

  const go = React.useCallback((href: string) => { onOpenChange(false); router.push(href); }, [router, onOpenChange]);

  const myTx = isAgent ? store.transactions.filter((t) => t.agentId === account?.agentId) : store.transactions;
  const myClients = isAgent ? store.clients.filter((c) => c.agentId === account?.agentId) : store.clients;
  const myListings = isAgent ? store.listings.filter((l) => l.listingAgentId === account?.agentId) : store.listings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="top-[18%] translate-y-0 p-0">
        <Command loop className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-3.5">
            <Search className="size-4 shrink-0 text-ink-4" />
            <Command.Input
              autoFocus
              placeholder="Search agents, clients, transactions, listings…"
              className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-4"
            />
            <KeyHint>Esc</KeyHint>
          </div>
          <Command.List className="thin-scrollbar max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-[13px] text-ink-3">
              No matches. Try an address, an agent name, or a client.
            </Command.Empty>

            <Group heading="Jump to">
              <Item onSelect={() => go(`${base}/dashboard`)} icon={<LayoutDashboard />}>Dashboard</Item>
              <Item onSelect={() => go(`${base}/transactions`)} icon={<FileSignature />}>{isAgent ? "My deals" : "Transactions"}</Item>
              <Item onSelect={() => go(`${base}/clients`)} icon={<Contact />}>Clients</Item>
              <Item onSelect={() => go(`${base}/listings`)} icon={<Building2 />}>Listings</Item>
              <Item onSelect={() => go(`${base}/events`)} icon={<CalendarDays />}>Events</Item>
              <Item onSelect={() => go(`${base}/library`)} icon={<BookMarked />}>Library</Item>
              {isAgent
                ? <>
                    <Item onSelect={() => go("/agent/projects")} icon={<Blocks />}>Project signing</Item>
                    <Item onSelect={() => go("/agent/commission")} icon={<Banknote />}>My commission</Item>
                  </>
                : <>
                    <Item onSelect={() => go("/admin/agents")} icon={<Users />}>Agents &amp; HR</Item>
                    <Item onSelect={() => go("/admin/payouts")} icon={<Banknote />}>Payouts &amp; 1099s</Item>
                  </>}
            </Group>

            <Group heading="Transactions">
              {myTx.map((t) => (
                <Item key={t.id} value={`${t.address} ${t.unit ?? ""} ${t.ref} ${t.city} ${t.counterparty}`} onSelect={() => go(`${base}/transactions/${t.id}`)} icon={<FileSignature />} meta={compactUsd(t.salePrice || t.listPrice)}>
                  {t.address}{t.unit ? ` ${t.unit}` : ""} <span className="text-ink-4">· {t.ref}</span>
                </Item>
              ))}
            </Group>

            <Group heading="Clients">
              {myClients.map((c) => (
                <Item key={c.id} value={`${c.name} ${c.email} ${c.areas.join(" ")}`} onSelect={() => go(`${base}/clients/${c.id}`)} icon={<Contact />} meta={c.type}>{c.name}</Item>
              ))}
            </Group>

            <Group heading="Listings">
              {myListings.map((l) => (
                <Item key={l.id} value={`${l.address} ${l.unit ?? ""} ${l.neighborhood} ${l.city} ${l.mlsId}`} onSelect={() => go(`${base}/listings/${l.id}`)} icon={<Building2 />} meta={compactUsd(l.price)}>
                  {l.address}{l.unit ? ` ${l.unit}` : ""}
                </Item>
              ))}
            </Group>

            {!isAgent && (
              <Group heading="Agents">
                {agents.map((a) => (
                  <Item key={a.id} value={`${a.name} ${a.email} ${a.neighborhoods.join(" ")} ${a.title}`} onSelect={() => go(`/admin/agents/${a.id}`)} icon={<Users />} meta={a.title}>{a.name}</Item>
                ))}
              </Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.07em] [&_[cmdk-group-heading]]:text-ink-4"
    >
      {children}
    </Command.Group>
  );
}

function Item({ children, onSelect, icon, meta, value }: {
  children: React.ReactNode; onSelect: () => void; icon: React.ReactNode; meta?: string; value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-2 text-[13.5px] text-ink-2 data-[selected=true]:bg-subtle data-[selected=true]:text-ink [&_svg]:size-4 [&_svg]:text-ink-4"
    >
      {icon}
      <span className="truncate">{children}</span>
      {meta && <span className="ml-auto shrink-0 text-[11.5px] capitalize text-ink-4">{meta}</span>}
      <ArrowRight className="ml-1 hidden shrink-0 group-data-[selected=true]:block" />
    </Command.Item>
  );
}

export function useCommandMenu() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
