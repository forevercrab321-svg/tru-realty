"use client";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, Megaphone, Pin } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/metric-card";
import { dateMed, dateShort, relative, titleCase, usd, compactUsd } from "@/lib/format";
import { agentName } from "@/data/agents";
import { userName } from "@/data/company";
import { EVENT_TYPE_LABEL } from "@/data/events";
import type { Announcement, BrokerageEvent, Transaction, TransactionTask } from "@/types";
import { cn, asset } from "@/lib/utils";

export function TaskQueue({ items, base }: { items: { task: TransactionTask; tx: Transaction }[]; base: string }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pending tasks</CardTitle>
          <p className="mt-0.5 text-[12.5px] text-ink-3">Compliance and closing items that need a person this week.</p>
        </div>
        <Badge tone={items.some((i) => i.task.status === "overdue") ? "risk" : "neutral"} size="sm">
          {items.filter((i) => i.task.status === "overdue").length} overdue
        </Badge>
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState title="Nothing outstanding" description="Every open task on active files is on schedule." className="m-4 border-dashed" />
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, 7).map(({ task, tx }) => (
            <li key={task.id}>
              <Link href={`${base}/transactions/${tx.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-canvas">
                <span className={cn("size-1.5 shrink-0 rounded-full",
                  task.priority === "high" ? "bg-risk-500" : task.priority === "medium" ? "bg-warn-500" : "bg-ink-4")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">{task.title}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-4">
                    {tx.address} · {agentName(tx.agentId)}
                  </p>
                </div>
                <span className={cn("shrink-0 text-[12px] tabular", task.status === "overdue" ? "text-risk-500" : "text-ink-3")}>
                  {relative(task.dueDate)}
                </span>
                <StatusBadge value={task.status} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ClosingsWidget({ items, base }: { items: Transaction[]; base: string }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Upcoming closings</CardTitle>
          <p className="mt-0.5 text-[12.5px] text-ink-3">Next 60 days, by closing date.</p>
        </div>
        <Button variant="ghost" size="xs" asChild><Link href={`${base}/transactions`}>All <ArrowRight /></Link></Button>
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState title="No closings scheduled" description="Nothing is scheduled to close in the next 60 days." className="m-4 border-dashed" />
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, 6).map((t) => (
            <li key={t.id}>
              <Link href={`${base}/transactions/${t.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                <img src={asset(t.image)} alt="" className="size-9 shrink-0 rounded-[7px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{t.address}{t.unit ? ` ${t.unit}` : ""}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-4">{t.ref} · {agentName(t.agentId)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-medium tabular text-ink">{compactUsd(t.salePrice || t.listPrice)}</p>
                  <p className="mt-0.5 text-[11.5px] tabular text-ink-4">{dateShort(t.closingDate)}</p>
                </div>
                <StatusBadge value={t.stage} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function EventsWidget({ items, base, onRsvp, registeredIds }: {
  items: BrokerageEvent[]; base: string; onRsvp?: (id: string) => void; registeredIds?: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming events</CardTitle>
        <Button variant="ghost" size="xs" asChild><Link href={`${base}/events`}>Event hub <ArrowRight /></Link></Button>
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="No upcoming events" description="Nothing on the company calendar yet." className="m-4 border-dashed" />
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, 4).map((e) => {
            const registered = registeredIds?.includes(e.id);
            return (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-[8px] border border-line bg-canvas">
                  <span className="text-[9.5px] uppercase tracking-wider text-ink-4">{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}</span>
                  <span className="text-[13px] font-semibold leading-none tabular text-ink">{new Date(e.date + "T12:00:00").getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`${base}/events/${e.id}`} className="truncate text-[13px] font-medium text-ink hover:underline">{e.name}</Link>
                  <p className="mt-0.5 truncate text-[12px] text-ink-4">{e.start} · {e.location}</p>
                </div>
                {onRsvp ? (
                  registered
                    ? <Badge tone="ok" size="sm">Registered</Badge>
                    : <Button size="xs" variant="secondary" onClick={() => onRsvp(e.id)}>RSVP</Button>
                ) : (
                  <Badge tone="neutral" size="sm">{e.registered}/{e.capacity}</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function AnnouncementsWidget({ items }: { items: Announcement[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company updates</CardTitle>
        <Megaphone className="size-4 text-ink-4" />
      </CardHeader>
      <ul className="divide-y divide-line">
        {items.slice(0, 4).map((a) => (
          <li key={a.id} className="px-5 py-3.5">
            <div className="flex items-start gap-2">
              {a.pinned && <Pin className="mt-0.5 size-3 shrink-0 text-brand-600" />}
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{a.body}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-4">
                  <Avatar name={userName(a.authorId)} size="xs" />
                  {userName(a.authorId)} · {dateMed(a.publishedAt)} · {a.category}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function StageBreakdown({ groups, total }: { groups: { label: string; count: number; value: number; tone: string }[]; total: number }) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] text-ink-2">{g.label}</p>
            <p className="text-[12.5px] tabular text-ink-3">
              <span className="font-medium text-ink">{g.count}</span> · {compactUsd(g.value)}
            </p>
          </div>
          <ProgressBar
            value={total ? (g.count / total) * 100 : 0}
            tone={g.tone as "brand" | "ok" | "warn" | "risk" | "ink"}
            className="mt-1.5"
          />
        </div>
      ))}
    </div>
  );
}

export function RiskList({ items, base }: { items: Transaction[]; base: string }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Needs attention</CardTitle>
          <p className="mt-0.5 text-[12.5px] text-ink-3">Files with a compliance gap or an overdue item.</p>
        </div>
        <AlertTriangle className="size-4 text-warn-500" />
      </CardHeader>
      {items.length === 0 ? (
        <EmptyState title="All files are clean" description="No compliance gaps across active transactions." className="m-4 border-dashed" />
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, 5).map((t) => (
            <li key={t.id}>
              <Link href={`${base}/transactions/${t.id}`} className="block px-5 py-3 transition-colors hover:bg-canvas">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[13px] font-medium text-ink">{t.address}{t.unit ? ` ${t.unit}` : ""}</p>
                  <span className="shrink-0 text-[11.5px] tabular text-ink-4">closes {dateShort(t.closingDate)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.riskFlags.map((f) => <Badge key={f} tone="warn" size="sm">{f}</Badge>)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function TransactionMini({ tx, base }: { tx: Transaction; base: string }) {
  return (
    <Link href={`${base}/transactions/${tx.id}`} className="flex items-center gap-3 rounded-[10px] border border-line bg-surface p-3 transition-shadow hover:shadow-md">
      <img src={asset(tx.image)} alt="" className="size-11 shrink-0 rounded-[8px] object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{tx.address}{tx.unit ? ` ${tx.unit}` : ""}</p>
        <p className="mt-0.5 text-[12px] text-ink-4">{titleCase(tx.side)} side · closes {dateShort(tx.closingDate)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[13px] font-medium tabular text-ink">{usd(tx.commission.netAgent)}</p>
        <p className="mt-0.5 text-[11px] text-ink-4">net to you</p>
      </div>
    </Link>
  );
}

export function EventTypeBadge({ type }: { type: BrokerageEvent["type"] }) {
  const tone = { training: "info", broker_meeting: "brand", open_house: "plum", company_event: "warn", webinar: "neutral", community: "ok" } as const;
  return <Badge tone={tone[type]} size="sm">{EVENT_TYPE_LABEL[type]}</Badge>;
}
