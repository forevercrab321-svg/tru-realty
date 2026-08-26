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
