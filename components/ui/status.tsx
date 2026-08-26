import { Badge, type BadgeProps } from "./badge";
import { titleCase } from "@/lib/format";

type Tone = NonNullable<BadgeProps["tone"]>;

const MAP: Record<string, Tone> = {
  // transactions
  lead: "neutral", offer: "info", accepted: "info", under_contract: "brand",
  inspection: "warn", appraisal: "warn", loan: "warn", final_walkthrough: "brand",
  closing: "brand", closed: "ok", cancelled: "risk",
  // generic
  active: "ok", pending: "warn", expired: "risk", expiring: "warn", inactive: "neutral",
  onboarding: "info", offboarding: "warn", draft: "neutral", sent: "info", viewed: "plum",
  signed: "brand", completed: "ok", declined: "risk", approved: "ok", rejected: "risk",
  submitted: "info", paid: "ok", billed: "warn", past_due: "risk", waived: "neutral",
  on_hold: "warn", open: "neutral", in_progress: "info", done: "ok", overdue: "risk",
  received: "ok", registered: "info", waitlisted: "warn", attended: "ok", no_show: "risk",
  cancelled_reg: "neutral", new_lead: "neutral", contacted: "info", meeting_scheduled: "info",
  interviewed: "warn", offer_sent: "brand", joined: "ok", not_interested: "risk",
  nurturing: "plum", lost: "risk", coming_soon: "plum", sold: "ok", withdrawn: "neutral",
  low: "neutral", medium: "info", high: "risk",
  issued: "ok", in_review: "warn", not_started: "neutral", corrected: "info",
  platinum: "brand", gold: "warn", silver: "neutral", emerging: "info",
  pre_construction: "plum", under_construction: "warn", now_selling: "ok",
  final_units: "warn", sold_out: "neutral",
};

export function StatusBadge({
  value, label, size = "md", className,
}: { value: string; label?: string; size?: BadgeProps["size"]; className?: string }) {
  return (
    <Badge tone={MAP[value] ?? "neutral"} size={size} dot className={className}>
      {label ?? titleCase(value)}
    </Badge>
  );
}
