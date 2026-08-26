"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAV } from "@/lib/nav";
import { company, offices } from "@/data/offices";
import { cn } from "@/lib/utils";
import { phoneFmt } from "@/lib/format";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const overHero = pathname === "/";

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes. Adjusting state during render is
  // React's recommended alternative to a setState-in-effect here.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false); }
  const light = overHero && !scrolled;

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-40 transition-all duration-300",
      scrolled || !overHero ? "border-b border-line bg-canvas/90 backdrop-blur-md" : "bg-transparent"
    )}>
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center gap-8 px-5 sm:px-8">
        <Logo tone={light ? "light" : "brand"} />
        <nav className="hidden items-center gap-1 md:flex">
          {PUBLIC_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-[7px] px-2.5 py-1.5 text-[13.5px] font-medium transition-colors",
                light ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-2 hover:bg-subtle hover:text-ink",
                pathname.startsWith(n.href) && (light ? "text-white" : "text-ink")
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href={`tel:${company.phone}`} className={cn("hidden items-center gap-1.5 text-[13px] font-medium lg:flex", light ? "text-white/75 hover:text-white" : "text-ink-2 hover:text-ink")}>
            <Phone className="size-3.5" /> {phoneFmt(company.phone)}
          </a>
          <Button size="sm" variant={light ? "secondary" : "secondary"} asChild className="hidden sm:inline-flex">
            <Link href="/login">Agent login</Link>
          </Button>
          <Button size="sm" variant={light ? "dark" : "primary"} asChild className="hidden sm:inline-flex">
            <Link href="/contact">Get started</Link>
          </Button>
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn("rounded-[7px] p-1.5 md:hidden", light ? "text-white hover:bg-white/10" : "text-ink hover:bg-subtle")}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-canvas px-5 py-4 md:hidden">
          <nav className="flex flex-col">
            {PUBLIC_NAV.map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-line/70 py-3 text-[15px] font-medium text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" full asChild><Link href="/login">Agent login</Link></Button>
            <Button variant="primary" full asChild><Link href="/contact">Get started</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-subtle/50">
      <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-ink-3">
              A modern New York brokerage built around the people who do the work — and the clients they move.
            </p>
            <Button variant="secondary" size="sm" className="mt-4" asChild>
              <Link href="/contact">Talk to us <ArrowRight /></Link>
            </Button>
          </div>

          <FooterCol title="Buy & Sell" links={[
            { label: "Search homes", href: "/properties" },
            { label: "New development", href: "/new-development" },
            { label: "Sell with Tru", href: "/services#sell" },
            { label: "Home valuation", href: "/contact?intent=valuation" },
          ]} />
          <FooterCol title="Company" links={[
            { label: "About", href: "/about" },
            { label: "Our agents", href: "/agents" },
            { label: "Services", href: "/services" },
            { label: "Join Tru Realty", href: "/contact?intent=join" },
          ]} />
          <div>
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-4">Offices</p>
            <ul className="space-y-2.5">
              {offices.map((o) => (
                <li key={o.id} className="text-[13px] leading-snug text-ink-3">
                  <span className="font-medium text-ink-2">{o.name.replace(" — Headquarters", "")}</span>
                  <br />{o.street}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12px] text-ink-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {company.legalName}. Licensed Real Estate Broker · License #{company.license}</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-ink-2">Fair Housing</Link>
            <Link href="/about" className="hover:text-ink-2">Standard Operating Procedures</Link>
            <Link href="/about" className="hover:text-ink-2">Privacy</Link>
          </div>
        </div>
        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-4/80">
          Demonstration environment. All listings, agents, prices and transactions shown are sample data.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-4">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-[13.5px] text-ink-3 transition-colors hover:text-ink">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
