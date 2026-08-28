import type { Permission } from "@/types";

export type NavItem = {
  label: string;
  href: string;
  icon: string;           // lucide icon name, resolved in the shell
  permission?: Permission;
  badgeKey?: "openTx" | "pendingTasks" | "recruits" | "expiringLicenses" | "pendingSign";
};

export type NavGroup = { label?: string; items: NavItem[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard", permission: "dashboard.view" },
      { label: "Pipeline", href: "/admin/pipeline", icon: "GitBranch", permission: "transactions.view", badgeKey: "recruits" },
      { label: "Transactions", href: "/admin/transactions", icon: "FileSignature", permission: "transactions.view", badgeKey: "openTx" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Agents & HR", href: "/admin/agents", icon: "Users", permission: "agents.view", badgeKey: "expiringLicenses" },
      { label: "Clients", href: "/admin/clients", icon: "Contact", permission: "clients.view" },
      { label: "Events", href: "/admin/events", icon: "CalendarDays", permission: "events.view" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Listings", href: "/admin/listings", icon: "Building2", permission: "listings.view" },
      { label: "Performance", href: "/admin/performance", icon: "TrendingUp", permission: "performance.view" },
      { label: "Library", href: "/admin/library", icon: "BookMarked", permission: "library.view" },
      { label: "E-Signature", href: "/admin/esign", icon: "PenLine", permission: "esign.view", badgeKey: "pendingSign" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Accounting", href: "/admin/accounting", icon: "Calculator", permission: "accounting.view" },
      { label: "Payouts & 1099s", href: "/admin/payouts", icon: "Banknote", permission: "payouts.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Company", href: "/admin/company", icon: "Landmark", permission: "company.settings" },
    ],
  },
];

export const AGENT_NAV: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/agent/dashboard", icon: "LayoutDashboard" },
      { label: "Clients", href: "/agent/clients", icon: "Contact" },
      { label: "Deals", href: "/agent/transactions", icon: "FileSignature" },
      { label: "Listings", href: "/agent/listings", icon: "Building2" },
    ],
  },
  {
    label: "Grow",
    items: [
      { label: "Project Signing", href: "/agent/projects", icon: "Blocks" },
      { label: "Event Hub", href: "/agent/events", icon: "CalendarDays" },
      { label: "Library", href: "/agent/library", icon: "BookMarked" },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Commission", href: "/agent/commission", icon: "Banknote" },
    ],
  },
];

export const PUBLIC_NAV = [
  { label: "Buy", href: "/properties" },
  { label: "New Development", href: "/new-development" },
  { label: "Agents", href: "/agents" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
];

/* ------------------------------------------------------------ ROUTE ACCESS */

/**
 * Routes that exist without a nav entry of their own.
 *
 * Every page under a portal must appear either in that portal's nav above or in this
 * list. `lib/route-access.test.ts` walks the app directory and fails if one does not,
 * because the guard denies what it does not recognise: an unregistered route would be
 * refused to everybody, which looks exactly like a bug rather than like a policy.
 */
export const UNLISTED_ROUTES: NavItem[] = [
  // An agent's own profile. Every agent has one, so it needs no permission — but it has
  // no sidebar entry either, and without this line the guard would lock them out of it.
  { label: "My profile", href: "/agent/profile", icon: "UserRound" },
];

export type Portal = "admin" | "agent";

const PORTAL_NAV: Record<Portal, NavGroup[]> = { admin: ADMIN_NAV, agent: AGENT_NAV };

/** Every registered route for a portal, nav entries and unlisted ones together. */
export function portalRoutes(portal: Portal): NavItem[] {
  return [
    ...PORTAL_NAV[portal].flatMap((g) => g.items),
    ...UNLISTED_ROUTES.filter((r) => r.href.startsWith(`/${portal}/`)),
  ];
}

/**
 * Drop any deployment prefix ahead of the portal segment.
 *
 * The site is exported under a `basePath` (`/tru-realty` on Pages, nothing on a custom
 * domain). `usePathname()` is documented to return the path without it, but this guard
 * fails *closed* — so if that ever stopped being true, every page in both portals would
 * refuse every role, which is a far worse outcome than the bug being fixed. Normalising
 * here makes the match true under either behaviour and costs one indexOf.
 */
function stripBasePath(portal: Portal, pathname: string): string {
  const marker = `/${portal}`;
  const idx = pathname.indexOf(marker);
  if (idx <= 0) return pathname;
  const rest = pathname.slice(idx);
  return rest === marker || rest.startsWith(`${marker}/`) ? rest : pathname;
}

export type RouteAccess =
  /** A registered route. `permission` undefined means everyone in the portal may see it. */
  | { kind: "registered"; item: NavItem; permission?: Permission }
  /** Not registered. The guard denies it — see the comment on UNLISTED_ROUTES. */
  | { kind: "unregistered" };

/**
 * Which permission a path requires, resolved from the same registry the sidebar renders
 * from. Deriving both from one source is the point: a route whose nav entry is hidden but
 * whose URL still serves is the defect this exists to close, and it can only reappear if
 * someone adds a page and skips the registry — which the test catches.
 *
 * Matching is longest-prefix on segment boundaries, so `/admin/transactions/tx_1041`
 * inherits from `/admin/transactions` while `/admin/transactionsomething` matches nothing.
 */
export function routeAccess(portal: Portal, pathname: string): RouteAccess {
  const path = stripBasePath(portal, pathname).replace(/\/+$/, "") || `/${portal}`;
  const match = portalRoutes(portal)
    .filter((i) => path === i.href || path.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? { kind: "registered", item: match, permission: match.permission } : { kind: "unregistered" };
}

/** Where to send someone who has landed somewhere they may not be. */
export function firstAllowedRoute(portal: Portal, holds: (p: Permission) => boolean): string {
  const item = portalRoutes(portal).find((i) => !i.permission || holds(i.permission));
  return item?.href ?? "/login";
}
