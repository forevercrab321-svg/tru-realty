import type { Permission, Role, RoleKey } from "@/types";

const ALL: Permission[] = [
  "dashboard.view", "agents.view", "agents.edit", "recruiting.view", "recruiting.edit",
  "transactions.view", "transactions.edit", "clients.view", "clients.edit",
  "listings.view", "listings.edit", "accounting.view", "accounting.edit",
  "commission.view", "commission.edit", "payouts.view", "payouts.edit",
  "events.view", "events.manage", "library.view", "library.manage",
  "performance.view", "esign.view", "esign.manage", "company.settings", "users.manage",
];

export const ROLES: Role[] = [
  {
    key: "super_admin", name: "Super Admin", system: true, userCount: 1,
    description: "Unrestricted access across every office, including system settings and role management.",
    permissions: ALL,
  },
  {
    key: "brokerage_admin", name: "Brokerage Admin", system: true, userCount: 1,
    description: "Runs day-to-day brokerage operations for one or more offices.",
    permissions: ALL.filter((p) => p !== "users.manage"),
  },
  {
    key: "transaction_coordinator", name: "Transaction Coordinator", system: true, userCount: 3,
    description: "Owns the transaction pipeline, compliance files and closing timelines.",
    permissions: ["dashboard.view", "transactions.view", "transactions.edit", "clients.view",
      "listings.view", "esign.view", "esign.manage", "library.view", "agents.view", "events.view"],
  },
  {
    key: "hr_ops", name: "HR / Operations", system: true, userCount: 1,
    description: "Recruiting, onboarding, licensing, training and offboarding.",
    permissions: ["dashboard.view", "agents.view", "agents.edit", "recruiting.view", "recruiting.edit",
      "events.view", "events.manage", "library.view", "library.manage", "performance.view", "esign.view"],
  },
  {
    key: "accounting", name: "Accounting", system: true, userCount: 2,
    description: "Commission disbursement, agent billing, payouts and 1099 reporting.",
    permissions: ["dashboard.view", "accounting.view", "accounting.edit", "commission.view",
      "commission.edit", "payouts.view", "payouts.edit", "transactions.view", "agents.view", "performance.view"],
  },
  {
    key: "agent", name: "Agent", system: true, userCount: 16,
    description: "Sees and manages only their own book of business.",
    permissions: ["dashboard.view", "clients.view", "clients.edit", "transactions.view",
      "listings.view", "listings.edit", "events.view", "library.view", "commission.view", "esign.view"],
  },
];

export const PERMISSION_GROUPS: { label: string; items: { key: Permission; label: string }[] }[] = [
  { label: "Agents & People", items: [
    { key: "agents.view", label: "View agent directory & profiles" },
    { key: "agents.edit", label: "Edit agent records, licenses, status" },
    { key: "recruiting.view", label: "View recruiting pipeline" },
    { key: "recruiting.edit", label: "Manage recruiting & onboarding" },
    { key: "users.manage", label: "Manage users, roles & permissions" },
  ]},
  { label: "Business", items: [
    { key: "transactions.view", label: "View transactions" },
    { key: "transactions.edit", label: "Edit transactions & tasks" },
    { key: "clients.view", label: "View client records" },
    { key: "clients.edit", label: "Edit client records" },
    { key: "listings.view", label: "View listings" },
    { key: "listings.edit", label: "Create & edit listings" },
  ]},
  { label: "Money", items: [
    { key: "accounting.view", label: "View accounting" },
    { key: "accounting.edit", label: "Post accounting entries" },
    { key: "commission.view", label: "View commission breakdowns" },
    { key: "commission.edit", label: "Adjust commission splits" },
    { key: "payouts.view", label: "View payouts & 1099s" },
    { key: "payouts.edit", label: "Approve & release payouts" },
  ]},
  { label: "Company", items: [
    { key: "events.manage", label: "Create & manage events" },
    { key: "library.manage", label: "Manage the resource library" },
    { key: "esign.manage", label: "Send & void signature requests" },
    { key: "performance.view", label: "View company performance" },
    { key: "company.settings", label: "Change company settings" },
  ]},
];

export function can(role: RoleKey, permission: Permission) {
  return ROLES.find((r) => r.key === role)?.permissions.includes(permission) ?? false;
}
