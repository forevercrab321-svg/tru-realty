"use client";
import * as React from "react";
import { Building2, Check, FileText, Plus, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status";
import { Stat } from "@/components/ui/metric-card";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Toggle } from "@/components/ui/misc";
import { ROLES, PERMISSION_GROUPS } from "@/lib/permissions";
import { company, offices } from "@/data/offices";
import { staffUsers, users, vendors } from "@/data/company";
import { signatureTemplates } from "@/data/esign";
import { libraryDocs } from "@/data/library";
import { dateMed, num, phoneFmt, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CompanyPage() {
  const [roleKey, setRoleKey] = React.useState(ROLES[1].key);
  const role = ROLES.find((r) => r.key === roleKey)!;
  const [settings, setSettings] = React.useState({
    requireWireVerification: true,
    autoAssignCoordinator: true,
    weeklyDisbursement: true,
    publicAgentProfiles: true,
    mlsAutoSync: false,
    twoFactor: true,
  });

  return (
    <>
      <PageHeader
        title="Company administration"
        description="Company record, offices, roles, permissions, templates and vendors."
      />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">System settings</TabsTrigger>
          <TabsTrigger value="forms">Forms & templates</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <div className="mt-5">
          <TabsContent value="company">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Company information</CardTitle></CardHeader>
                <CardBody>
                  <dl className="grid gap-5 sm:grid-cols-2">
                    <Stat label="Legal name" value={company.legalName} />
                    <Stat label="Doing business as" value={company.dba} />
                    <Stat label="Brokerage license" value={<span className="tabular">{company.license}</span>} />
                    <Stat label="EIN" value={<span className="tabular">{company.ein}</span>} />
                    <Stat label="Principal broker" value={company.principalBroker} />
                    <Stat label="Founded" value={String(company.founded)} />
                    <Stat label="Licensed states" value={company.states.join(", ")} />
                    <Stat label="MLS boards" value={company.mlsBoards.join(", ")} />
                    <Stat label="Headquarters" value={company.hq} />
                    <Stat label="Main line" value={phoneFmt(company.phone)} />
                  </dl>
                  <Button variant="secondary" size="sm" className="mt-5" onClick={() => toast.success("Company record updated")}>Edit company record</Button>
                </CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Compliance posture</CardTitle></CardHeader>
                <CardBody className="space-y-3">
                  {[
                    ["E&O insurance", "Current through Dec 31, 2026", true],
                    ["Fair housing SOP published", "Updated Mar 11, 2026", true],
                    ["AML policy acknowledged", "14 of 16 agents", false],
                    ["Wire verification required", "Enforced on every file", true],
                    ["Record retention", "7 years, cloud archive", true],
                  ].map(([label, detail, ok]) => (
                    <div key={label as string} className="flex items-start gap-2.5">
                      <span className={cn("mt-0.5 flex size-4 items-center justify-center rounded-full", ok ? "bg-ok-50 text-ok-700" : "bg-warn-50 text-warn-700")}>
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="text-[13px] text-ink">{label}</p>
                        <p className="text-[12px] text-ink-4">{detail}</p>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="offices">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {offices.map((o) => (
                <Card key={o.id}>
                  <CardBody>
                    <Building2 className="size-4 text-ink-4" />
                    <p className="mt-3 text-[14px] font-semibold text-ink">{o.name.replace(" — Headquarters", "")}</p>
                    <Badge tone="neutral" size="sm" className="mt-1.5">{o.code}</Badge>
                    <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">{o.street}<br />{o.city}, {o.state} {o.zip}</p>
                    <dl className="mt-4 space-y-2 border-t border-line pt-3">
                      <Stat label="Managing broker" value={o.managingBroker} />
                      <Stat label="Agents" value={num(o.agentCount)} />
                      <Stat label="Opened" value={dateMed(o.opened)} />
                      <Stat label="Phone" value={phoneFmt(o.phone)} />
                    </dl>
                  </CardBody>
                </Card>
              ))}
            </div>
            <Button variant="secondary" className="mt-4" onClick={() => toast.success("Office form would open here")}><Plus /> Add office</Button>
          </TabsContent>

          <TabsContent value="roles">
            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <Card>
                <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
                <ul className="divide-y divide-line">
                  {ROLES.map((r) => (
                    <li key={r.key}>
                      <button
                        onClick={() => setRoleKey(r.key)}
                        className={cn("flex w-full items-center justify-between px-5 py-3 text-left transition-colors", roleKey === r.key ? "bg-canvas" : "hover:bg-canvas/60")}
                      >
                        <div className="min-w-0">
                          <p className={cn("truncate text-[13px]", roleKey === r.key ? "font-medium text-ink" : "text-ink-2")}>{r.name}</p>
                          <p className="text-[11.5px] text-ink-4">{r.userCount} {r.userCount === 1 ? "user" : "users"}</p>
                        </div>
                        {r.system && <Shield className="size-3.5 shrink-0 text-ink-4" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <p className="mt-0.5 max-w-xl text-[12.5px] leading-relaxed text-ink-3">{role.description}</p>
                  </div>
                  <Badge tone="neutral" size="sm">{role.permissions.length} permissions</Badge>
                </CardHeader>
                <CardBody className="space-y-5">
                  {PERMISSION_GROUPS.map((g) => (
                    <div key={g.label}>
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">{g.label}</p>
                      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        {g.items.map((p) => {
                          const has = role.permissions.includes(p.key);
                          return (
                            <li key={p.key} className="flex items-center justify-between gap-3">
                              <span className={cn("text-[12.5px]", has ? "text-ink-2" : "text-ink-4")}>{p.label}</span>
                              <Toggle checked={has} onChange={() => toast.success(role.system ? "System roles are read-only in the demo" : "Permission updated")} label={p.label} />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <Button size="sm" variant="primary" onClick={() => toast.success("Invitation sent")}><Plus /> Invite user</Button>
              </CardHeader>
              <ul className="divide-y divide-line">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={u.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{u.name}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-4">{u.email} · {u.title}</p>
                    </div>
                    <Badge tone={u.role === "agent" ? "neutral" : "brand"} size="sm">{titleCase(u.role)}</Badge>
                    <span className="hidden text-[12px] text-ink-4 sm:block">active {dateMed(u.lastActive)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Operations</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  {[
                    ["requireWireVerification", "Require wire verification task", "Adds a mandatory verbal wire-verification task to every transaction."],
                    ["autoAssignCoordinator", "Auto-assign coordinator", "Assigns a transaction coordinator by office when a file is created."],
                    ["weeklyDisbursement", "Weekly disbursement schedule", "Release approved payouts every Wednesday at 2:00 PM ET."],
                    ["mlsAutoSync", "MLS auto-sync", "Pull listing status and media from the MLS feed hourly."],
                  ].map(([key, label, help]) => (
                    <div key={key} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[13px] text-ink">{label}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-4">{help}</p>
                      </div>
                      <Toggle
                        checked={settings[key as keyof typeof settings]}
                        onChange={(v) => { setSettings((s) => ({ ...s, [key]: v })); toast.success(`${label} ${v ? "enabled" : "disabled"}`); }}
                        label={label}
                      />
                    </div>
                  ))}
                </CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Security & branding</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] text-ink">Require two-factor authentication</p>
                      <p className="mt-0.5 text-[12px] text-ink-4">Enforced for every user with accounting or admin access.</p>
                    </div>
                    <Toggle checked={settings.twoFactor} onChange={(v) => setSettings((s) => ({ ...s, twoFactor: v }))} label="2FA" />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] text-ink">Public agent profiles</p>
                      <p className="mt-0.5 text-[12px] text-ink-4">Publish agent bios and listings on trurealty.com.</p>
                    </div>
                    <Toggle checked={settings.publicAgentProfiles} onChange={(v) => setSettings((s) => ({ ...s, publicAgentProfiles: v }))} label="Public profiles" />
                  </div>
                  <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                    <Field label="Default commission plan">
                      <NativeSelect defaultValue="Cap Plan 80/20">
                        <option>Cap Plan 80/20</option><option>Premier 90/10</option><option>Standard 70/30</option><option>Launch 60/40</option>
                      </NativeSelect>
                    </Field>
                    <Field label="Default transaction fee"><Input defaultValue="295" type="number" /></Field>
                    <Field label="Fiscal year start"><Input defaultValue="January" /></Field>
                    <Field label="Record retention (years)"><Input defaultValue="7" type="number" /></Field>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => toast.success("Settings saved")}>Save settings</Button>
                </CardBody>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forms">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Signature templates</CardTitle></CardHeader>
                <ul className="divide-y divide-line">
                  {signatureTemplates.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <FileText className="size-4 shrink-0 text-ink-4" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{t.name}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">{t.category} · {t.fields} fields · used {num(t.usageCount)} times</p>
                      </div>
                      <span className="text-[12px] tabular text-ink-4">{dateMed(t.updatedAt)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardHeader><CardTitle>Standard forms</CardTitle></CardHeader>
                <ul className="divide-y divide-line">
                  {libraryDocs.filter((d) => d.category === "Forms").map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                      <FileText className="size-4 shrink-0 text-ink-4" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{d.title}</p>
                        <p className="mt-0.5 text-[11.5px] text-ink-4">Updated {dateMed(d.updatedAt)} · {num(d.downloads)} downloads</p>
                      </div>
                      <Badge tone="neutral" size="sm">{d.fileType.toUpperCase()}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Vendor directory</CardTitle>
                <Button size="sm" variant="secondary" onClick={() => toast.success("Vendor form would open here")}><Plus /> Add vendor</Button>
              </CardHeader>
              <ul className="divide-y divide-line">
                {vendors.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={v.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{v.name}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-4">{v.contact} · {phoneFmt(v.phone)} · {v.email}</p>
                    </div>
                    <Badge tone="neutral" size="sm">{v.category}</Badge>
                    <span className="text-[12.5px] tabular text-ink-3">{v.rating.toFixed(1)} ★</span>
                    <span className="hidden text-[12px] text-ink-4 sm:block">{v.transactions} files</span>
                    {v.preferred && <Badge tone="brand" size="sm">Preferred</Badge>}
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
