"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Lock, Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DEMO_ACCOUNTS, useSession } from "@/lib/session";
import { cn, asset } from "@/lib/utils";

function LoginInner() {
  const { signIn } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState("admin@trurealty.com");
  const [password, setPassword] = React.useState("demo");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const account = signIn(email);
    if (!account) {
      setError("We don't recognize that address. Pick one of the demo accounts below.");
      setPending(false);
      return;
    }
    router.push(account.portal === "admin" ? "/admin/dashboard" : "/agent/dashboard");
  }

  const next = params.get("next");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: `url(${asset("/listings/l1-1.svg")})`, backgroundSize: "cover", backgroundPosition: "center", mixBlendMode: "luminosity" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/85 to-brand-900/40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo tone="light" size="lg" />
          <div className="max-w-md">
            <p className="text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-white text-balance">
              The brokerage operating system behind every Tru deal.
            </p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-brand-200">
              Recruiting, onboarding, transactions, commissions, listings, training and payouts — one platform instead of nine.
            </p>
            <ul className="mt-7 space-y-2.5">
              {["46 agents across 4 offices", "$434M in year-to-date volume", "1 place to close, get paid and grow"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[13.5px] text-white/80">
                  <span className="flex size-4 items-center justify-center rounded-full bg-brand-500/40"><Check className="size-2.5 text-white" strokeWidth={3} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[12px] text-white/40">© 2026 Tru Realty Group LLC · Licensed Real Estate Broker</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center bg-canvas px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="lg:hidden"><Logo size="md" /></div>
          <h1 className="mt-8 text-[24px] font-semibold tracking-[-0.025em] text-ink lg:mt-0">Sign in</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-3">
            {next === "agent" ? "Sign in to the agent portal to continue." : "Welcome back. Choose a demo account to explore the platform."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <Field label="Work email">
              <Input icon={<Mail />} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@trurealty.com" />
            </Field>
            <Field label="Password" hint="Any value works in the demo">
              <Input icon={<Lock />} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p className="text-[12.5px] text-risk-500">{error}</p>}
            <Button type="submit" variant="primary" size="lg" full disabled={pending}>
              {pending ? "Signing in…" : "Sign in"} <ArrowRight />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11.5px] uppercase tracking-[0.09em] text-ink-4">Demo accounts</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <ul className="space-y-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button
                  onClick={() => { setEmail(a.email); setError(""); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[10px] border p-2.5 text-left transition-colors",
                    email === a.email ? "border-brand-300 bg-brand-50/60" : "border-line bg-surface hover:border-line-strong"
                  )}
                >
                  <Avatar name={a.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{a.name}</p>
                    <p className="truncate text-[11.5px] text-ink-4">{a.email}</p>
                  </div>
                  <Badge tone={a.portal === "admin" ? "brand" : "info"} size="sm">
                    {a.portal === "admin" ? "Back office" : "Agent"}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between text-[12.5px]">
            <Link href="/forgot-password" className="text-ink-3 hover:text-ink">Forgot password?</Link>
            <Link href="/" className="text-brand-700 hover:underline">Back to trurealty.com</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginInner />
    </React.Suspense>
  );
}
