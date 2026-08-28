"use client";
import * as React from "react";
import { CalendarCheck, Check, Clock, MapPin, Video } from "lucide-react";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { listings } from "@/data/listings";
import { agentById } from "@/data/agents";
import { compactUsd, dateMed } from "@/lib/format";
import { asset, cn } from "@/lib/utils";

const TIME_SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"];

/** Next seven days, skipping nothing — brokers show property on weekends too. */
function upcomingDays() {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date("2026-08-27T12:00:00");
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });
}

export function BookTourDialog({
  trigger,
  listingId,
}: {
  trigger: React.ReactNode;
  listingId?: string;
}) {
  const days = React.useMemo(() => upcomingDays(), []);
  const available = listings.filter((l) => !["sold", "withdrawn", "expired"].includes(l.status));

  const [open, setOpen] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [property, setProperty] = React.useState(listingId ?? available[0]?.id ?? "");
  const [mode, setMode] = React.useState<"in_person" | "virtual">("in_person");
  const [day, setDay] = React.useState(days[0].iso);
  const [slot, setSlot] = React.useState(TIME_SLOTS[2]);

  const listing = listings.find((l) => l.id === property);
  const agent = listing ? agentById(listing.listingAgentId) : undefined;

  function reset() {
    setDone(false);
    setDay(days[0].iso);
    setSlot(TIME_SLOTS[2]);
    setMode("in_person");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        {done ? (
          <>
            <DialogHeader title="Your tour is requested" />
            <DialogBody>
              <div className="flex flex-col items-center py-4 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check className="size-5" strokeWidth={3} />
                </span>
                <p className="mt-4 text-[15px] font-medium text-ink">
                  {mode === "virtual" ? "Virtual tour" : "Private showing"} · {dateMed(day)} at {slot}
                </p>
                {listing && (
                  <p className="mt-1 text-[13.5px] text-ink-3">
                    {listing.address}
                    {listing.unit ? `, ${listing.unit}` : ""} · {listing.neighborhood}
                  </p>
                )}
                {agent && (
                  <div className="mt-5 flex items-center gap-2.5 rounded-[10px] border border-line bg-canvas px-4 py-3">
                    <Avatar name={agent.name} size="lg" />
                    <div className="text-left">
                      <p className="text-[13.5px] font-medium text-ink">{agent.name}</p>
                      <p className="text-[12.5px] text-ink-3">
                        will confirm within the hour during business hours
                      </p>
                    </div>
                  </div>
                )}
                <p className="mt-5 max-w-sm text-[12.5px] leading-relaxed text-ink-4">
                  Nothing is locked in until your agent confirms — buildings and sellers each have
                  their own access rules, so a time occasionally has to move.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={reset}>
                Book another
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <DialogHeader
              title="Book a tour"
              description="Pick a property and a time. Your agent confirms — usually within the hour."
            />
            <DialogBody className="space-y-5">
              <Field label="Property">
                <NativeSelect value={property} onChange={(e) => setProperty(e.target.value)}>
                  {available.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.address}
                      {l.unit ? `, ${l.unit}` : ""} — {l.neighborhood} · {compactUsd(l.price)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              {listing && (
                <div className="flex items-center gap-3 rounded-[10px] border border-line bg-canvas p-3">
                  <img
                    src={asset(listing.images[0])}
                    alt=""
                    className="size-14 shrink-0 rounded-[8px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">
                      {compactUsd(listing.price)} · {listing.beds} bd · {listing.baths} ba
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-ink-3">
                      <MapPin className="size-3" />
                      {listing.neighborhood}, {listing.city}
                    </p>
                  </div>
                  {agent && (
                    <div className="hidden items-center gap-2 sm:flex">
                      <Avatar name={agent.name} size="sm" />
                      <span className="text-[12px] text-ink-3">{agent.firstName}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-ink-2">How would you like to tour?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "in_person", label: "In person", icon: <MapPin />, hint: "Meet at the property" },
                      { key: "virtual", label: "Virtual", icon: <Video />, hint: "Live walkthrough by video" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setMode(o.key)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-[10px] border p-3 text-left transition-colors",
                        mode === o.key
                          ? "border-brand-400 bg-brand-50/60"
                          : "border-line bg-surface hover:border-line-strong"
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink [&_svg]:size-3.5 [&_svg]:text-ink-4">
                        {o.icon}
                        {o.label}
                      </span>
                      <span className="text-[11.5px] text-ink-4">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-ink-2">Preferred day</p>
                <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {days.map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setDay(d.iso)}
                      className={cn(
                        "flex w-[62px] shrink-0 flex-col items-center rounded-[10px] border py-2 transition-colors",
                        day === d.iso
                          ? "border-brand-500 bg-brand-700 text-white"
                          : "border-line bg-surface text-ink-2 hover:border-line-strong"
                      )}
                    >
                      <span className="text-[10.5px] uppercase tracking-wider opacity-70">{d.weekday}</span>
                      <span className="text-[17px] font-semibold leading-tight tabular">{d.day}</span>
                      <span className="text-[10.5px] opacity-70">{d.month}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2">
                  <Clock className="size-3.5 text-ink-4" /> Preferred time
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlot(t)}
                      className={cn(
                        "rounded-[8px] border py-2 text-[12.5px] font-medium transition-colors",
                        slot === t
                          ? "border-brand-500 bg-brand-700 text-white"
                          : "border-line bg-surface text-ink-2 hover:border-line-strong"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input required placeholder="Jordan Reyes" />
                </Field>
                <Field label="Phone">
                  <Input required type="tel" placeholder="(917) 555-0142" />
                </Field>
                <Field label="Email" className="sm:col-span-2">
                  <Input required type="email" placeholder="you@email.com" />
                </Field>
                <Field label="Anything we should know?" hint="Optional" className="sm:col-span-2">
                  <Textarea placeholder="Timeline, must-haves, whether you're working with a lender." />
                </Field>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                <CalendarCheck /> Request this tour
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TourBadge() {
  return (
    <Badge tone="ok" size="sm" dot>
      Same-day tours available
    </Badge>
  );
}
