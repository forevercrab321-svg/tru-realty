"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Save } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Toggle } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "@/lib/session";
import { toast } from "sonner";

export default function SettingsPage() {
  const { account } = useSession();
  const [prefs, setPrefs] = React.useState({ compact: false, weekStart: true, emailDigest: true });

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-[900px] items-center gap-4 px-5">
          <Logo />
          <Button variant="ghost" size="sm" className="ml-auto" asChild>
            <Link href={account?.portal === "agent" ? "/agent/dashboard" : "/admin/dashboard"}><ArrowLeft /> Back to workspace</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-10">
        <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-ink">Preferences</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-3">Personal settings for how the workspace behaves for you.</p>

        <div className="mt-7 space-y-4">
          <Card>
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={account?.name ?? ""} size="xl" />
                <div>
                  <p className="text-[14px] font-medium text-ink">{account?.name}</p>
                  <p className="text-[12.5px] text-ink-3">{account?.email} · {account?.title}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name"><Input defaultValue={account?.name} /></Field>
                <Field label="Email"><Input defaultValue={account?.email} /></Field>
                <Field label="Time zone">
                  <NativeSelect defaultValue="America/New_York">
                    <option value="America/New_York">Eastern — New York</option>
                    <option value="America/Chicago">Central — Chicago</option>
                    <option value="America/Los_Angeles">Pacific — Los Angeles</option>
                  </NativeSelect>
                </Field>
                <Field label="Date format">
                  <NativeSelect defaultValue="us"><option value="us">Aug 26, 2026</option><option value="iso">2026-08-26</option></NativeSelect>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              {[
                ["compact", "Compact tables", "Reduce row height in data tables to fit more on screen."],
                ["weekStart", "Start the week on Monday", "Affects calendars and week-over-week comparisons."],
                ["emailDigest", "Daily email digest", "One summary each weekday morning at 7:00 AM."],
              ].map(([key, label, help]) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-ink">{label}</p>
                    <p className="mt-0.5 text-[12px] text-ink-4">{help}</p>
                  </div>
                  <Toggle checked={prefs[key as keyof typeof prefs]} onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} label={label} />
                </div>
              ))}
              <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] text-ink"><Monitor className="size-3.5 text-ink-4" /> Appearance</p>
                  <p className="mt-0.5 text-[12px] text-ink-4">Tru Realty currently ships a single light theme tuned for long sessions.</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" onClick={() => toast.success("Preferences saved")}><Save /> Save preferences</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
