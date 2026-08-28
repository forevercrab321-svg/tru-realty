"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Permission, RoleKey } from "@/types";
import { can } from "./permissions";
import { firstAllowedRoute, routeAccess } from "./nav";
import { NoAccess } from "@/components/shared/no-access";
import { staffUsers } from "@/data/company";
import { agents } from "@/data/agents";

export type DemoAccount = {
  email: string;
  password: string;
  userId: string;
  name: string;
  role: RoleKey;
  title: string;
  agentId?: string;
  portal: "admin" | "agent";
  blurb: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "admin@trurealty.com", password: "demo", userId: "usr_admin_whitfield", name: "Grace Whitfield", role: "super_admin", title: "Principal Broker & Co-Founder", portal: "admin", blurb: "Full access across every office, plus system settings and permissions." },
  { email: "ops@trurealty.com", password: "demo", userId: "usr_admin_okafor", name: "Andre Okafor", role: "brokerage_admin", title: "Director of Brokerage Operations", portal: "admin", blurb: "Runs day-to-day operations. Everything except user & role management." },
  { email: "tc@trurealty.com", password: "demo", userId: "usr_tc_reeves", name: "Dana Reeves", role: "transaction_coordinator", title: "Senior Transaction Coordinator", portal: "admin", blurb: "Transaction pipeline, compliance files and closing timelines." },
  { email: "hr@trurealty.com", password: "demo", userId: "usr_hr_bell", name: "Simone Bell", role: "hr_ops", title: "Director of Agent Experience", portal: "admin", blurb: "Recruiting, onboarding, licensing, training and offboarding." },
  { email: "accounting@trurealty.com", password: "demo", userId: "usr_acct_navarro", name: "Ruben Navarro", role: "accounting", title: "Controller", portal: "admin", blurb: "Commission disbursement, agent billing, payouts and 1099s." },
  { email: "agent@trurealty.com", password: "demo", userId: "usr_schen", name: "Sophia Chen", role: "agent", title: "Associate Broker · Senior Advisor", agentId: "ag_schen", portal: "agent", blurb: "Top-producing agent. Sees only her own book of business." },
  { email: "newagent@trurealty.com", password: "demo", userId: "usr_cwhite", name: "Caleb White", role: "agent", title: "Licensed Salesperson", agentId: "ag_cwhite", portal: "agent", blurb: "Second-year agent — a lighter pipeline shows empty and early states." },
];

type SessionValue = {
  account: DemoAccount | null;
  ready: boolean;
  signIn: (email: string) => DemoAccount | null;
  signOut: () => void;
  hasPermission: (p: Permission) => boolean;
};

const Ctx = React.createContext<SessionValue>({
  account: null, ready: false, signIn: () => null, signOut: () => {}, hasPermission: () => false,
});

const KEY = "tru.session.email";

const KEY_LISTENERS = new Set<() => void>();

function readStoredEmail(): string | null {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}

/**
 * localStorage is an external store, so it is read with useSyncExternalStore rather
 * than an effect. The server snapshot is `undefined`, which is what tells the tree
 * "we don't know who this is yet" and renders the loading state during hydration.
 */
function subscribe(cb: () => void) {
  KEY_LISTENERS.add(cb);
  window.addEventListener("storage", cb);
  return () => { KEY_LISTENERS.delete(cb); window.removeEventListener("storage", cb); };
}

function emitSessionChange() {
  KEY_LISTENERS.forEach((cb) => cb());
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const stored = React.useSyncExternalStore<string | null | undefined>(
    subscribe,
    readStoredEmail,
    () => undefined
  );

  const ready = stored !== undefined;
  const account = React.useMemo(
    () => (stored ? DEMO_ACCOUNTS.find((a) => a.email === stored) ?? null : null),
    [stored]
  );

  const signIn = React.useCallback((email: string) => {
    const found = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
    if (found) {
      window.localStorage.setItem(KEY, found.email);
      // When a gateway is configured, sign in there too. The assistants get their
      // identity from a cookie the gateway signs and verifies — never from anything
      // this browser asserts about itself. Fire and forget: a gateway that is down
      // must not block signing in to the app.
      const gw = process.env.NEXT_PUBLIC_AI_GATEWAY;
      if (gw) {
        void fetch(`${gw}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: found.email }),
        }).catch(() => {});
      }
      document.cookie = `tru_role=${found.role}; path=/; max-age=86400`;
      emitSessionChange();
    }
    return found;
  }, []);

  const signOut = React.useCallback(() => {
    window.localStorage.removeItem(KEY);
    document.cookie = "tru_role=; path=/; max-age=0";
    emitSessionChange();
  }, []);

  const value = React.useMemo<SessionValue>(() => ({
    account, ready, signIn, signOut,
    hasPermission: (p) => (account ? can(account.role, p) : false),
  }), [account, ready, signIn, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => React.useContext(Ctx);

export function useCurrentAgent() {
  const { account } = useSession();
  return account?.agentId ? agents.find((a) => a.id === account.agentId) ?? null : null;
}

export function useStaffUser() {
  const { account } = useSession();
  return staffUsers.find((u) => u.id === account?.userId) ?? null;
}

/**
 * The portal guard: who may be here, and on which page.
 *
 * It used to check only the portal, so every route under `/admin` served its full contents
 * to any signed-in staff account. The sidebar hid what a role could not use, and the URL
 * handed it over anyway — a transaction coordinator typing `/admin/payouts` read every
 * agent's TIN, and the AI assistant refused the same request one panel away. Two answers to
 * the same question in one product.
 *
 * The permission now comes from `routeAccess()`, which reads the same nav registry the
 * sidebar renders from, so a hidden link and a refused URL cannot disagree. An unregistered
 * route is denied rather than allowed; `lib/route-access.test.ts` makes sure none exists.
 *
 * **This is a client-side check on a static export, and it is not a security boundary.**
 * It is correct behaviour, not enforcement: the data is in the bundle, so anyone determined
 * enough reads it regardless. Real enforcement arrives with the server and row-level
 * security in Phase 3 — see docs/data-model.md — and this map is the specification it will
 * implement. Nothing here should ever be described to a client as securing anything.
 */
export function RequirePortal({ portal, children }: { portal: "admin" | "agent"; children: React.ReactNode }) {
  const { account, ready } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (!ready) return;
    if (!account) router.replace(`/login?next=${portal}`);
    else if (account.portal !== portal) router.replace(account.portal === "admin" ? "/admin/dashboard" : "/agent/dashboard");
  }, [ready, account, portal, router]);

  if (!ready || !account || account.portal !== portal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="size-7 animate-spin rounded-full border-2 border-line border-t-brand-600" />
          <p className="text-[13px] text-ink-3">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * The per-route half of the guard, rendered *inside* the shell rather than around it.
 *
 * That placement is the whole design: the sidebar stays, still listing exactly what this
 * role can open, and the refusal appears in the content pane beside it. Replacing the
 * entire screen would strand the person with one button and no way to see where they are
 * allowed to go — and it would hide the very thing worth seeing, which is that the nav and
 * the URL now agree.
 */
export function RequireRouteAccess({ portal, children }: { portal: "admin" | "agent"; children: React.ReactNode }) {
  const { account, hasPermission } = useSession();
  const pathname = usePathname();
  if (!account) return null;

  const access = routeAccess(portal, pathname ?? `/${portal}`);
  const permitted =
    access.kind === "registered" && (!access.permission || hasPermission(access.permission));
  if (permitted) return <>{children}</>;

  const home = firstAllowedRoute(portal, hasPermission);
  return (
    <NoAccess
      permission={access.kind === "registered" ? access.permission : undefined}
      role={account.role}
      backHref={home}
      backLabel={home === "/login" ? "Back to sign in" : "Go to a page you can open"}
    />
  );
}
