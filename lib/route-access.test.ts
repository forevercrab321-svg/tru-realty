import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_NAV, AGENT_NAV, UNLISTED_ROUTES, portalRoutes, routeAccess, firstAllowedRoute, type Portal } from "./nav";
import { ROLES, can } from "./permissions";
import { DEMO_ACCOUNTS } from "./session";
import type { Permission } from "@/types";

/**
 * The defect these cover, in one sentence: the sidebar hid what a role could not use and
 * the URL served it anyway. A transaction coordinator typing `/admin/payouts` read every
 * agent's TIN while the AI assistant, one panel away, refused the same request.
 *
 * So the tests are written against the two things that must never diverge — what the nav
 * shows and what the guard allows — and against the filesystem, because the way this
 * regresses is that someone adds a page and forgets the registry.
 */

const PORTALS: Portal[] = ["admin", "agent"];

/** Every route that actually exists on disk, as a URL path. */
function routesOnDisk(portal: Portal): string[] {
  const root = path.resolve(__dirname, "..", "app", portal);
  const out: string[] = [];
  const walk = (dir: string, url: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name), `${url}/${entry.name}`);
      else if (entry.name === "page.tsx") out.push(url);
    }
  };
  walk(root, `/${portal}`);
  return out.sort();
}

/** `/admin/agents/[id]` is served by the `/admin/agents` entry; test it as a real URL. */
const asConcreteUrl = (route: string) => route.replace(/\[[^\]]+\]/g, "sample-id");

describe("every route on disk is registered", () => {
  for (const portal of PORTALS) {
    it(`${portal}: no page exists that the registry does not know about`, () => {
      const registered = portalRoutes(portal).map((i) => i.href);
      for (const route of routesOnDisk(portal)) {
        const access = routeAccess(portal, asConcreteUrl(route));
        expect(
          access.kind,
          `${route} matches no nav entry or UNLISTED_ROUTES entry. The guard denies what it does not recognise, so this page would be refused to everyone. Registered: ${registered.join(", ")}`,
        ).toBe("registered");
      }
    });
  }

  it("no entry in UNLISTED_ROUTES duplicates a nav entry", () => {
    const navHrefs = [...ADMIN_NAV, ...AGENT_NAV].flatMap((g) => g.items).map((i) => i.href);
    for (const extra of UNLISTED_ROUTES) {
      expect(navHrefs, `${extra.href} is already in the nav`).not.toContain(extra.href);
    }
  });
});

describe("the nav and the guard agree, for every role and every route", () => {
  const staffRoles = DEMO_ACCOUNTS.filter((a) => a.portal === "admin").map((a) => a.role);

  for (const role of staffRoles) {
    const holds = (p: Permission) => can(role, p);

    it(`${role}: is refused exactly the admin routes its sidebar hides`, () => {
      for (const item of portalRoutes("admin")) {
        const inNav = !item.permission || holds(item.permission);
        const access = routeAccess("admin", item.href);
        const allowed = access.kind === "registered" && (!access.permission || holds(access.permission));
        expect(allowed, `${item.href}: sidebar ${inNav ? "shows" : "hides"} it, guard ${allowed ? "allows" : "refuses"} it`).toBe(inNav);
      }
    });

    it(`${role}: a detail page inherits the refusal of its list page`, () => {
      for (const item of portalRoutes("admin")) {
        if (item.permission && !holds(item.permission)) {
          const deep = routeAccess("admin", `${item.href}/some-record-id`);
          expect(deep.kind).toBe("registered");
          expect(deep.kind === "registered" && deep.permission).toBe(item.permission);
        }
      }
    });

    it(`${role}: always has somewhere to land`, () => {
      expect(firstAllowedRoute("admin", holds)).not.toBe("/login");
    });
  }
});

describe("the specific refusals this was built for", () => {
  const holdsFor = (roleKey: string) => (p: Permission) => can(roleKey as never, p);
  const refused = (role: string, href: string) => {
    const a = routeAccess("admin", href);
    return a.kind === "registered" && !!a.permission && !holdsFor(role)(a.permission);
  };

  it("a transaction coordinator cannot open payouts by URL", () => {
    expect(refused("transaction_coordinator", "/admin/payouts")).toBe(true);
    expect(refused("transaction_coordinator", "/admin/accounting")).toBe(true);
    expect(refused("transaction_coordinator", "/admin/company")).toBe(true);
  });

  it("HR cannot open transactions, payouts or clients", () => {
    expect(refused("hr_ops", "/admin/transactions")).toBe(true);
    expect(refused("hr_ops", "/admin/transactions/tx_1041")).toBe(true);
    expect(refused("hr_ops", "/admin/payouts")).toBe(true);
    expect(refused("hr_ops", "/admin/clients")).toBe(true);
  });

  it("accounting cannot open clients or company settings", () => {
    expect(refused("accounting", "/admin/clients")).toBe(true);
    expect(refused("accounting", "/admin/company")).toBe(true);
  });

  it("accounting can open payouts — the guard narrows, it does not just deny", () => {
    expect(refused("accounting", "/admin/payouts")).toBe(false);
    expect(refused("accounting", "/admin/accounting")).toBe(false);
  });

  it("only the principal broker reaches company settings", () => {
    const withCompany = ROLES.filter((r) => r.permissions.includes("company.settings")).map((r) => r.key);
    expect(withCompany).toContain("super_admin");
    expect(withCompany).not.toContain("transaction_coordinator");
    expect(withCompany).not.toContain("accounting");
    expect(withCompany).not.toContain("hr_ops");
  });

  it("an invented URL under a portal is refused rather than served", () => {
    expect(routeAccess("admin", "/admin/payroll-export").kind).toBe("unregistered");
    expect(routeAccess("admin", "/admin/transactionsomething").kind).toBe("unregistered");
  });

  it("a trailing slash does not slip past the guard", () => {
    const a = routeAccess("admin", "/admin/payouts/");
    expect(a.kind === "registered" && a.permission).toBe("payouts.view");
  });
});

describe("the deployment prefix cannot lock everyone out", () => {
  it("resolves the same whether or not usePathname returns the basePath", () => {
    const bare = routeAccess("admin", "/admin/payouts");
    const prefixed = routeAccess("admin", "/tru-realty/admin/payouts");
    expect(prefixed).toEqual(bare);
    expect(prefixed.kind === "registered" && prefixed.permission).toBe("payouts.view");
  });

  it("still refuses an invented route under a prefix", () => {
    expect(routeAccess("admin", "/tru-realty/admin/payroll-export").kind).toBe("unregistered");
  });

  it("does not mistake a lookalike segment for the portal", () => {
    expect(routeAccess("admin", "/x/administrator/payouts").kind).toBe("unregistered");
  });
});
