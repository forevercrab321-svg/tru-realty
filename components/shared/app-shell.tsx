"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { CommandMenu, useCommandMenu } from "./command-menu";
import { NotificationCenter } from "./notifications";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { KeyHint } from "@/components/ui/misc";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import type { NavGroup } from "@/lib/nav";
import { officeName } from "@/data/offices";
import { agents } from "@/data/agents";

function Icon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <C className={className} />;
}

export function AppShell({
  nav, portal, children,
}: { nav: NavGroup[]; portal: "admin" | "agent"; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, signOut, hasPermission } = useSession();
  const store = useStore();
  const cmd = useCommandMenu();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Collapse the mobile drawer on navigation without a setState-in-effect.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setMobileOpen(false); }

  const badges: Record<string, number> = {
    openTx: store.transactions.filter((t) => !["closed", "cancelled"].includes(t.stage) && (portal === "admin" || t.agentId === account?.agentId)).length,
    recruits: store.recruits.filter((r) => !["joined", "not_interested"].includes(r.stage)).length,
    expiringLicenses: agents.filter((a) => a.license.status === "expiring" || a.license.status === "expired").length,
    pendingSign: store.signatureRequests.filter((s) => ["sent", "viewed"].includes(s.status)).length,
    pendingTasks: 0,
  };

  const visibleNav = nav
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.permission || hasPermission(i.permission)) }))
    .filter((g) => g.items.length > 0);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Logo href={`/${portal}/dashboard`} />
        <button className="rounded-[6px] p-1 text-ink-4 hover:bg-subtle lg:hidden" onClick={() => setMobileOpen(false)}>
          <Icons.X className="size-4" />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={() => cmd.setOpen(true)}
          className="flex h-8 w-full items-center gap-2 rounded-[8px] border border-line bg-surface px-2.5 text-[12.5px] text-ink-4 shadow-xs transition-colors hover:border-line-strong hover:text-ink-3"
        >
          <Icons.Search className="size-3.5" />
          <span>Search…</span>
          <span className="ml-auto flex gap-0.5"><KeyHint>⌘</KeyHint><KeyHint>K</KeyHint></span>
        </button>
      </div>

      <nav className="thin-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {visibleNav.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-4")}>
            {group.label && (
              <p className="mb-1 px-2 text-[10.5px] font-medium uppercase tracking-[0.09em] text-ink-4">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex h-8 items-center gap-2.5 rounded-[8px] px-2 text-[13px] transition-colors",
                        active ? "bg-surface font-medium text-ink shadow-xs ring-1 ring-line" : "text-ink-2 hover:bg-surface/70 hover:text-ink"
                      )}
                    >
                      <Icon name={item.icon} className={cn("size-4 shrink-0", active ? "text-brand-700" : "text-ink-4 group-hover:text-ink-3")} />
                      <span className="truncate">{item.label}</span>
                      {badge > 0 && (
                        <span className={cn("ml-auto rounded-[5px] px-1.5 text-[11px] font-medium tabular",
                          active ? "bg-brand-50 text-brand-700" : "bg-sunken text-ink-3")}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        {portal === "agent" ? (
          <Link href="/agent/profile" className="flex items-center gap-2.5 rounded-[8px] p-1.5 transition-colors hover:bg-surface">
            <Avatar name={account?.name ?? ""} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-ink">{account?.name}</p>
              <p className="truncate text-[11.5px] text-ink-4">{account?.title}</p>
            </div>
            <Icons.ChevronRight className="size-3.5 text-ink-4" />
          </Link>
        ) : (
          <div className="rounded-[9px] border border-line bg-surface p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-4">Demo workspace</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
              Signed in as <span className="font-medium text-ink-2">{account?.name}</span> ({account?.role.replace(/_/g, " ")}).
            </p>
            <button onClick={store.resetDemoData} className="mt-2 text-[12px] text-brand-700 hover:underline">
              Reset demo data
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <CommandMenu open={cmd.open} onOpenChange={cmd.setOpen} />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] border-r border-line bg-subtle/60 lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-line bg-subtle lg:hidden">{sidebar}</aside>
        </>
      )}

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6">
          <button className="rounded-[7px] p-1.5 text-ink-3 hover:bg-subtle lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Icons.Menu className="size-5" />
          </button>
          <div className="lg:hidden"><Logo href={`/${portal}/dashboard`} showWord={false} /></div>

          <div className="hidden items-center gap-2 lg:flex">
            <Breadcrumbs pathname={pathname} portal={portal} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => cmd.setOpen(true)}
              className="flex size-8 items-center justify-center rounded-[7px] text-ink-3 transition-colors hover:bg-subtle hover:text-ink lg:hidden"
              aria-label="Search"
            >
              <Icons.Search className="size-[17px]" />
            </button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/"><Icons.Globe /> Public site</Link>
            </Button>
            <NotificationCenter />
            <Dropdown>
              <DropdownTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-[8px] p-0.5 pr-1.5 transition-colors hover:bg-subtle">
                  <Avatar name={account?.name ?? ""} size="md" />
                  <Icons.ChevronDown className="size-3.5 text-ink-4" />
                </button>
              </DropdownTrigger>
              <DropdownContent className="w-[236px]">
                <div className="px-2 py-2">
                  <p className="text-[13px] font-medium text-ink">{account?.name}</p>
                  <p className="mt-0.5 text-[12px] text-ink-3">{account?.email}</p>
                  <p className="mt-1.5 text-[11.5px] text-ink-4">
                    {account?.role.replace(/_/g, " ")} · {officeName(portal === "agent" ? agents.find((a) => a.id === account?.agentId)?.officeId ?? "of_flatiron" : "of_flatiron")}
                  </p>
                </div>
                <DropdownSeparator />
                <DropdownItem onSelect={() => router.push(portal === "agent" ? "/agent/profile" : "/admin/company")}>
                  <Icons.User /> {portal === "agent" ? "My profile" : "Company settings"}
                </DropdownItem>
                <DropdownItem onSelect={() => router.push("/settings")}><Icons.Settings /> Preferences</DropdownItem>
                <DropdownItem onSelect={() => cmd.setOpen(true)}><Icons.Command /> Command menu</DropdownItem>
                <DropdownSeparator />
                <DropdownLabel>Switch demo account</DropdownLabel>
                <DropdownItem onSelect={() => router.push("/login")}><Icons.Repeat /> Change role</DropdownItem>
                <DropdownItem destructive onSelect={() => { signOut(); router.push("/login"); }}>
                  <Icons.LogOut /> Sign out
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

const LABELS: Record<string, string> = {
  admin: "Admin", agent: "Agent", dashboard: "Dashboard", pipeline: "Pipeline",
  transactions: "Transactions", agents: "Agents & HR", clients: "Clients", listings: "Listings",
  events: "Events", library: "Library", performance: "Performance", esign: "E-Signature",
  accounting: "Accounting", payouts: "Payouts & 1099s", company: "Company", projects: "Project Signing",
  commission: "Commission", profile: "Profile",
};

function Breadcrumbs({ pathname, portal }: { pathname: string; portal: string }) {
  const parts = pathname.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-[12.5px] text-ink-4">
      <span className="capitalize">{portal === "admin" ? "Back Office" : "Front Office"}</span>
      {parts.slice(1).map((p, i) => (
        <React.Fragment key={i}>
          <Icons.ChevronRight className="size-3 opacity-50" />
          <span className={cn(i === parts.length - 2 && "text-ink-2")}>{LABELS[p] ?? p.replace(/^tx_|^cl_|^ls_|^ag_/, "").slice(0, 14)}</span>
        </React.Fragment>
      ))}
    </nav>
  );
}
