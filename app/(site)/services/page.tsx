import Link from "next/link";
import {
  ArrowRight, Camera, ClipboardCheck, FileSignature, Home, LineChart, Megaphone,
  Search, ShieldCheck, Users, Wallet, GraduationCap,
} from "lucide-react";
import { PageHero } from "@/components/public/section";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Services" };

const BUY = [
  { icon: <Search />, title: "Search & shortlist", body: "Your agent builds a filtered feed against your actual criteria — including buildings that never hit a portal." },
  { icon: <ClipboardCheck />, title: "Due diligence", body: "Board minutes, financials, tax abatement schedules and offering plans reviewed before you write an offer." },
  { icon: <FileSignature />, title: "Offer & negotiation", body: "A written strategy on price, contingencies and timing — and a net sheet so you know your all-in number." },
  { icon: <ShieldCheck />, title: "Closing coordination", body: "A dedicated coordinator tracks mortgage commitment, appraisal, title and walkthrough against your contract dates." },
];

const SELL = [
  { icon: <LineChart />, title: "Pricing analysis", body: "An adjustment-grid CMA against real comps, plus absorption data for your specific building or block." },
  { icon: <Camera />, title: "Preparation & media", body: "Staging consult, professional photography, floor plans and video — coordinated and paid for by us." },
  { icon: <Megaphone />, title: "Launch & marketing", body: "Syndication, targeted digital, print where it still works, and a broker preview before the first open house." },
  { icon: <Home />, title: "Offer management", body: "Every offer presented side by side with a net-to-seller comparison so the decision is about numbers, not pressure." },
];

const AGENT = [
  { icon: <Wallet />, title: "Published economics", body: "80–90% splits with a hard company-dollar cap. No hidden per-transaction charges at closing." },
  { icon: <Users />, title: "Real coordinator support", body: "A transaction coordinator per twelve agents — not a shared inbox." },
  { icon: <GraduationCap />, title: "Structured launch program", body: "Six weeks of onboarding with weekly activity targets and an accountability partner." },
  { icon: <LineChart />, title: "One platform", body: "CRM, deals, documents, e-signature, commission and payouts in a single portal you actually log into." },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="What working with Tru actually looks like"
        description="No mystery process. Here is the work we do on each side of a transaction, and what we give the agents who do it."
      />

      <Block id="buy" title="For buyers" description="From first search to keys in hand." items={BUY} />
      <Block id="sell" title="For sellers" description="Pricing, preparation and a launch that respects your timeline." items={SELL} tinted />
      <Block id="agents" title="For agents" description="The support structure behind every Tru deal." items={AGENT} />

      <section className="border-t border-line bg-brand-900">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-white">Ready when you are.</h2>
            <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-brand-200">
              Tell us whether you are buying, selling or thinking about a move in your career — we will route you to the right person.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button size="lg" variant="secondary" asChild><Link href="/contact">Contact us</Link></Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild>
              <Link href="/agents">Browse agents <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Block({ id, title, description, items, tinted }: {
  id: string; title: string; description: string; tinted?: boolean;
  items: { icon: React.ReactNode; title: string; body: string }[];
}) {
  return (
    <section id={id} className={tinted ? "border-y border-line bg-subtle/40" : "bg-surface"}>
      <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
        <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-ink">{title}</h2>
        <p className="mt-2 text-[14.5px] text-ink-3">{description}</p>
        <div className="mt-8 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => (
            <div key={f.title}>
              <span className="mb-3.5 flex size-9 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700 [&_svg]:size-[18px]">{f.icon}</span>
              <p className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{f.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-3">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
