"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/public/section";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { company, offices } from "@/data/offices";
import { agents } from "@/data/agents";
import { phoneFmt } from "@/lib/format";

const INTENTS = [
  { value: "buy", label: "I'm looking to buy" },
  { value: "sell", label: "I'm thinking about selling" },
  { value: "rent", label: "I'm looking to rent" },
  { value: "valuation", label: "I want a home valuation" },
  { value: "join", label: "I'm an agent interested in joining" },
  { value: "other", label: "Something else" },
];

function ContactInner() {
  const params = useSearchParams();
  const [sent, setSent] = React.useState(false);
  const initial = params.get("intent") ?? (params.get("listing") ? "buy" : params.get("project") ? "buy" : "buy");
  const [intent, setIntent] = React.useState(initial);
  const agentId = params.get("agent");
  const agent = agents.find((a) => a.id === agentId);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={intent === "join" ? "Let's talk about your business" : "Tell us what you're trying to do"}
        description={
          agent
            ? `Your message goes directly to ${agent.name} at the ${agent.neighborhoods[0]} desk.`
            : "We route every inquiry to the agent who actually works that neighborhood — usually within one business day."
        }
        compact
      />

      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div>
          {sent ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-8">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white">
                <Check className="size-4" strokeWidth={3} />
              </span>
              <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.02em] text-ink">Thanks — we&apos;ve got it.</h2>
              <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-ink-2">
                {agent ? `${agent.name} will` : "An agent who covers your area will"} reach out within one business day.
                If it&apos;s urgent, call us at {phoneFmt(company.phone)}.
              </p>
              <Button variant="secondary" className="mt-5" onClick={() => setSent(false)}>Send another message</Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSent(true); }}
              className="rounded-xl border border-line bg-surface p-6 shadow-xs"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name"><Input required placeholder="Jordan" /></Field>
                <Field label="Last name"><Input required placeholder="Reyes" /></Field>
                <Field label="Email"><Input required type="email" placeholder="you@email.com" /></Field>
                <Field label="Phone" hint="Optional"><Input type="tel" placeholder="(917) 555-0142" /></Field>
                <Field label="How can we help?" className="sm:col-span-2">
                  <NativeSelect value={intent} onChange={(e) => setIntent(e.target.value)}>
                    {INTENTS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </NativeSelect>
                </Field>
                {intent !== "join" && (
                  <>
                    <Field label="Neighborhood or area"><Input placeholder="Park Slope, Brooklyn" /></Field>
                    <Field label="Budget or price range" hint="Optional"><Input placeholder="$1.2M – $1.6M" /></Field>
                  </>
                )}
                {intent === "join" && (
                  <>
                    <Field label="Current brokerage"><Input placeholder="Independent" /></Field>
                    <Field label="Trailing 12-month volume" hint="Optional"><Input placeholder="$8,400,000" /></Field>
                  </>
                )}
                <Field label="Anything else we should know?" className="sm:col-span-2">
                  <Textarea placeholder="Timeline, must-haves, questions — whatever is useful." />
                </Field>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button type="submit" variant="primary" size="lg">Send message</Button>
                <p className="text-[12px] text-ink-4">We never sell your information. See our privacy policy.</p>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-4">Reach us directly</p>
            <a href={`tel:${company.phone}`} className="mt-3 flex items-center gap-2 text-[14px] text-ink hover:underline">
              <Phone className="size-4 text-ink-4" /> {phoneFmt(company.phone)}
            </a>
            <a href={`mailto:${company.email}`} className="mt-2 flex items-center gap-2 text-[14px] text-ink hover:underline">
              <Mail className="size-4 text-ink-4" /> {company.email}
            </a>
          </div>
          {offices.map((o) => (
            <div key={o.id} className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[14px] font-semibold text-ink">{o.name.replace(" — Headquarters", "")}</p>
              <p className="mt-1.5 flex gap-2 text-[13px] leading-relaxed text-ink-3">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-4" />
                <span>{o.street}<br />{o.city}, {o.state} {o.zip}</span>
              </p>
              <p className="mt-2 text-[13px] text-ink-3">{phoneFmt(o.phone)}</p>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}

export default function ContactPage() {
  return <React.Suspense fallback={<div className="min-h-screen" />}><ContactInner /></React.Suspense>;
}
