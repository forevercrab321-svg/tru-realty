"use client";
import * as React from "react";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { agents, activeAgents } from "@/data/agents";
import { staffUsers } from "@/data/company";
import { projects } from "@/data/projects";
import { usd } from "@/lib/format";

/* ------------------------------------------------------------------ CLIENT */

export function NewClientDialog({ trigger, defaultAgentId }: { trigger: React.ReactNode; defaultAgentId?: string }) {
  const { createClient } = useStore();
  const { account } = useSession();
  const [open, setOpen] = React.useState(false);
  const agentId = defaultAgentId ?? account?.agentId ?? "ag_schen";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader title="Add a client" description="Creates a record in the CRM and assigns follow-up to an agent." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            createClient({
              name: String(f.get("name")),
              email: String(f.get("email")),
              phone: String(f.get("phone")),
              type: f.get("type") as never,
              status: f.get("status") as never,
              agentId: String(f.get("agentId")),
              budgetMin: Number(f.get("budgetMin") || 0),
              budgetMax: Number(f.get("budgetMax") || 0),
              areas: String(f.get("areas") || "").split(",").map((s) => s.trim()).filter(Boolean),
              propertyType: String(f.get("propertyType")),
              beds: Number(f.get("beds") || 1),
              leadSource: String(f.get("leadSource")),
              nextFollowUp: String(f.get("nextFollowUp") || "") || null,
            });
            setOpen(false);
          }}
        >
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2"><Input name="name" required placeholder="Jordan Reyes" /></Field>
            <Field label="Email"><Input name="email" type="email" placeholder="jordan@email.com" /></Field>
            <Field label="Phone"><Input name="phone" placeholder="(917) 555-0142" /></Field>
            <Field label="Client type">
              <NativeSelect name="type" defaultValue="buyer">
                <option value="buyer">Buyer</option><option value="seller">Seller</option>
                <option value="both">Buyer &amp; Seller</option><option value="renter">Renter</option>
                <option value="investor">Investor</option>
              </NativeSelect>
            </Field>
            <Field label="Status">
              <NativeSelect name="status" defaultValue="new_lead">
                <option value="new_lead">New lead</option><option value="nurturing">Nurturing</option>
                <option value="active">Active</option>
              </NativeSelect>
            </Field>
            <Field label="Budget minimum"><Input name="budgetMin" type="number" placeholder="750000" /></Field>
            <Field label="Budget maximum"><Input name="budgetMax" type="number" placeholder="950000" /></Field>
            <Field label="Target areas" hint="Comma separated" className="sm:col-span-2">
              <Input name="areas" placeholder="Park Slope, Cobble Hill" />
            </Field>
            <Field label="Property type">
              <NativeSelect name="propertyType" defaultValue="Condo">
                {["Condo", "Co-op", "Townhouse", "Single Family", "Multi-Family", "Loft"].map((t) => <option key={t}>{t}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Bedrooms"><Input name="beds" type="number" defaultValue={2} min={0} /></Field>
            <Field label="Lead source">
              <NativeSelect name="leadSource" defaultValue="Sphere of Influence">
                {["Sphere of Influence", "Past Client", "Referral", "StreetEasy", "Zillow", "Open House", "Website Form", "Instagram", "Event"].map((t) => <option key={t}>{t}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Next follow-up"><Input name="nextFollowUp" type="date" defaultValue="2026-09-02" /></Field>
            <Field label="Assigned agent" className="sm:col-span-2">
              <NativeSelect name="agentId" defaultValue={agentId} disabled={!!account?.agentId}>
                {activeAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------- TRANSACTION */

export function NewTransactionDialog({ trigger, defaultAgentId }: { trigger: React.ReactNode; defaultAgentId?: string }) {
  const { createTransaction, clients } = useStore();
  const { account } = useSession();
  const [open, setOpen] = React.useState(false);
  const agentId = defaultAgentId ?? account?.agentId ?? "ag_schen";
  const [selectedAgent, setSelectedAgent] = React.useState(agentId);
  const available = clients.filter((c) => c.agentId === selectedAgent);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader title="Open a transaction" description="Creates the file, seeds compliance tasks and assigns a coordinator." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            createTransaction({
              address: String(f.get("address")), city: String(f.get("city")), zip: String(f.get("zip")),
              propertyType: String(f.get("propertyType")), side: f.get("side") as never,
              agentId: String(f.get("agentId")), clientId: String(f.get("clientId")),
              listPrice: Number(f.get("listPrice")), commissionPct: Number(f.get("commissionPct")),
              closingDate: String(f.get("closingDate")), coordinatorId: String(f.get("coordinatorId")),
            });
            setOpen(false);
          }}
        >
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Property address" className="sm:col-span-2"><Input name="address" required placeholder="212 Java Street" /></Field>
            <Field label="City"><Input name="city" required defaultValue="Brooklyn" /></Field>
            <Field label="ZIP"><Input name="zip" required defaultValue="11222" /></Field>
            <Field label="Property type">
              <NativeSelect name="propertyType" defaultValue="Condo">
                {["Condo", "Co-op", "Townhouse", "Single Family", "Multi-Family", "Loft", "New Development"].map((t) => <option key={t}>{t}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Representation side">
              <NativeSelect name="side" defaultValue="buyer">
                <option value="buyer">Buyer side</option><option value="listing">Listing side</option>
                <option value="dual">Both sides</option><option value="rental">Rental</option>
              </NativeSelect>
            </Field>
            <Field label="Agent">
              <NativeSelect name="agentId" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} disabled={!!account?.agentId}>
                {activeAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Client">
              <NativeSelect name="clientId" required>
                {available.length === 0 && <option value="">No clients yet — add one first</option>}
                {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="List / contract price"><Input name="listPrice" type="number" required defaultValue={950000} /></Field>
            <Field label="Total commission %"><Input name="commissionPct" type="number" step="0.25" required defaultValue={5} /></Field>
            <Field label="Target closing date"><Input name="closingDate" type="date" required defaultValue="2026-11-15" /></Field>
            <Field label="Transaction coordinator">
              <NativeSelect name="coordinatorId" defaultValue="usr_tc_reeves">
                {staffUsers.filter((u) => u.role === "transaction_coordinator").map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </NativeSelect>
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- LISTING */

export function NewListingDialog({ trigger, defaultAgentId }: { trigger: React.ReactNode; defaultAgentId?: string }) {
  const { createListing } = useStore();
  const { account } = useSession();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader title="Create a listing" description="Saved as Coming Soon until the MLS feed confirms syndication." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            createListing({
              address: String(f.get("address")), unit: String(f.get("unit") || "") || undefined,
              city: String(f.get("city")), zip: String(f.get("zip")), neighborhood: String(f.get("neighborhood")),
              price: Number(f.get("price")), propertyType: f.get("propertyType") as never,
              beds: Number(f.get("beds")), baths: Number(f.get("baths")), sqft: Number(f.get("sqft")),
              yearBuilt: Number(f.get("yearBuilt")), listingAgentId: String(f.get("listingAgentId")),
              description: String(f.get("description")),
              features: String(f.get("features") || "").split(",").map((s) => s.trim()).filter(Boolean),
            });
            setOpen(false);
          }}
        >
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Street address"><Input name="address" required placeholder="84 India Street" /></Field>
            <Field label="Unit" hint="Optional"><Input name="unit" placeholder="4B" /></Field>
            <Field label="City"><Input name="city" required defaultValue="Brooklyn" /></Field>
            <Field label="Neighborhood"><Input name="neighborhood" required defaultValue="Greenpoint" /></Field>
            <Field label="ZIP"><Input name="zip" required defaultValue="11222" /></Field>
            <Field label="Asking price"><Input name="price" type="number" required defaultValue={1250000} /></Field>
            <Field label="Property type">
              <NativeSelect name="propertyType" defaultValue="Condo">
                {["Condo", "Co-op", "Townhouse", "Single Family", "Multi-Family", "Loft"].map((t) => <option key={t}>{t}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Year built"><Input name="yearBuilt" type="number" defaultValue={1998} /></Field>
            <Field label="Bedrooms"><Input name="beds" type="number" defaultValue={2} /></Field>
            <Field label="Bathrooms"><Input name="baths" type="number" step="0.5" defaultValue={2} /></Field>
            <Field label="Square feet"><Input name="sqft" type="number" defaultValue={1100} /></Field>
            <Field label="Listing agent">
              <NativeSelect name="listingAgentId" defaultValue={defaultAgentId ?? account?.agentId ?? "ag_schen"} disabled={!!account?.agentId}>
                {activeAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Key features" hint="Comma separated" className="sm:col-span-2">
              <Input name="features" placeholder="Private Garden, In-Unit Laundry, Roof Rights" />
            </Field>
            <Field label="Public description" className="sm:col-span-2">
              <Textarea name="description" placeholder="Two sentences that would make someone book a showing." />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create listing</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------- EVENT */

export function NewEventDialog({ trigger }: { trigger: React.ReactNode }) {
  const { createEvent } = useStore();
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader title="Create an event" description="Publishes to the agent Event Hub and opens registration immediately." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            createEvent({
              name: String(f.get("name")), type: f.get("type") as never, date: String(f.get("date")),
              start: String(f.get("start")), end: String(f.get("end")), location: String(f.get("location")),
              hostId: String(f.get("hostId")), capacity: Number(f.get("capacity")),
              description: String(f.get("description")), officeId: String(f.get("officeId")) as never,
              ceCredits: Number(f.get("ceCredits")) || null,
            });
            setOpen(false);
          }}
        >
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Event name" className="sm:col-span-2"><Input name="name" required placeholder="Listing Presentation Lab" /></Field>
            <Field label="Type">
              <NativeSelect name="type" defaultValue="training">
                <option value="training">Training</option><option value="broker_meeting">Broker Meeting</option>
                <option value="open_house">Open House</option><option value="company_event">Company Event</option>
                <option value="webinar">Webinar</option><option value="community">Community</option>
              </NativeSelect>
            </Field>
            <Field label="Date"><Input name="date" type="date" required defaultValue="2026-09-15" /></Field>
            <Field label="Start time"><Input name="start" required defaultValue="10:00 AM" /></Field>
            <Field label="End time"><Input name="end" required defaultValue="11:30 AM" /></Field>
            <Field label="Location" className="sm:col-span-2"><Input name="location" required defaultValue="Flatiron HQ · Training Room A" /></Field>
            <Field label="Host">
              <NativeSelect name="hostId" defaultValue="ag_schen">
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Capacity"><Input name="capacity" type="number" defaultValue={24} /></Field>
            <Field label="Audience">
              <NativeSelect name="officeId" defaultValue="all">
                <option value="all">All offices</option>
                <option value="of_flatiron">Flatiron</option><option value="of_williamsburg">Williamsburg</option>
                <option value="of_lic">Long Island City</option><option value="of_gardencity">Garden City</option>
              </NativeSelect>
            </Field>
            <Field label="CE credits" hint="Leave 0 if none"><Input name="ceCredits" type="number" step="0.5" defaultValue={0} /></Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="description" placeholder="What agents will walk away able to do." />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- RECRUIT */

export function NewRecruitDialog({ trigger }: { trigger: React.ReactNode }) {
  const { createRecruit } = useStore();
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader title="Add a recruiting candidate" description="Lands in New Lead with a follow-up assigned to the recruiter." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            createRecruit({
              name: String(f.get("name")), currentBrokerage: String(f.get("brokerage")),
              email: String(f.get("email")), phone: String(f.get("phone")),
              yearsExperience: Number(f.get("years") || 0), productionVolume: Number(f.get("volume") || 0),
              leadSource: f.get("source") as never, recruiterId: String(f.get("recruiterId")),
              targetOfficeId: String(f.get("officeId")), notes: String(f.get("notes")),
              nextFollowUp: String(f.get("followUp") || "") || null,
            });
            setOpen(false);
          }}
        >
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2"><Input name="name" required placeholder="Alexandra Voss" /></Field>
            <Field label="Current brokerage"><Input name="brokerage" placeholder="Compass" /></Field>
            <Field label="Years licensed"><Input name="years" type="number" defaultValue={5} /></Field>
            <Field label="Email"><Input name="email" type="email" /></Field>
            <Field label="Phone"><Input name="phone" /></Field>
            <Field label="Trailing 12-mo volume"><Input name="volume" type="number" placeholder="18400000" /></Field>
            <Field label="Lead source">
              <NativeSelect name="source" defaultValue="Referral">
                {["Referral", "Inbound", "Event", "Cold Outreach", "LinkedIn", "MLS Data"].map((s) => <option key={s}>{s}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Recruiter">
              <NativeSelect name="recruiterId" defaultValue="ag_schen">
                {agents.filter((a) => a.status === "active").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Target office">
              <NativeSelect name="officeId" defaultValue="of_flatiron">
                <option value="of_flatiron">Flatiron</option><option value="of_williamsburg">Williamsburg</option>
                <option value="of_lic">Long Island City</option><option value="of_gardencity">Garden City</option>
              </NativeSelect>
            </Field>
            <Field label="Next follow-up" className="sm:col-span-2"><Input name="followUp" type="date" defaultValue="2026-09-01" /></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" placeholder="What they care about, and what would move them." /></Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add to pipeline</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------- TRANSACTION SUB-DIALOGS */

export function AddTaskDialog({ txId, trigger }: { txId: string; trigger: React.ReactNode }) {
  const { addTransactionTask } = useStore();
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader title="Add a task" />
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget as HTMLFormElement);
          addTransactionTask(txId, {
            title: String(f.get("title")), dueDate: String(f.get("dueDate")),
            assigneeId: String(f.get("assigneeId")), status: "open",
            priority: f.get("priority") as never, category: f.get("category") as never,
          });
          setOpen(false);
        }}>
          <DialogBody className="space-y-4">
            <Field label="Task"><Input name="title" required placeholder="Order municipal search" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Due date"><Input name="dueDate" type="date" required defaultValue="2026-09-05" /></Field>
              <Field label="Priority">
                <NativeSelect name="priority" defaultValue="medium">
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </NativeSelect>
              </Field>
              <Field label="Category">
                <NativeSelect name="category" defaultValue="closing">
                  <option value="compliance">Compliance</option><option value="closing">Closing</option>
                  <option value="marketing">Marketing</option><option value="client">Client</option><option value="finance">Finance</option>
                </NativeSelect>
              </Field>
              <Field label="Assignee">
                <NativeSelect name="assigneeId" defaultValue="usr_tc_reeves">
                  {[...staffUsers, ...agents.map((a) => ({ id: a.id, name: a.name }))].map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UploadDocumentDialog({ txId, trigger }: { txId: string; trigger: React.ReactNode }) {
  const { addTransactionDocument } = useStore();
  const { account } = useSession();
  const [open, setOpen] = React.useState(false);
  const [queued, setQueued] = React.useState<{ name: string; sizeKb: number }[]>([]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader title="Upload documents" description="Files are attached to this transaction and visible to the coordinator." />
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget as HTMLFormElement);
          const category = String(f.get("category"));
          const list = queued.length ? queued : [{ name: String(f.get("manualName") || "Untitled document.pdf"), sizeKb: 420 }];
          list.forEach((file) =>
            addTransactionDocument(txId, {
              name: file.name, category,
              fileType: (file.name.split(".").pop() as never) ?? "pdf",
              sizeKb: file.sizeKb,
            }, account?.userId ?? "usr_tc_reeves")
          );
          setQueued([]);
          setOpen(false);
        }}>
          <DialogBody className="space-y-4">
            <Field label="Category">
              <NativeSelect name="category" defaultValue="Compliance">
                {["Agency", "Compliance", "Contract", "Financing", "Inspection", "Title", "Closing", "Marketing"].map((c) => <option key={c}>{c}</option>)}
              </NativeSelect>
            </Field>
            <FileUpload onFiles={setQueued} />
            {queued.length === 0 && (
              <Field label="Or record a document name" hint="If the file lives elsewhere">
                <Input name="manualName" placeholder="Municipal search results.pdf" />
              </Field>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Attach {queued.length > 0 ? `${queued.length} file${queued.length > 1 ? "s" : ""}` : "document"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------ BUYER REGISTRATION */

export function BuyerRegistrationDialog({ trigger, projectId }: { trigger: React.ReactNode; projectId?: string }) {
  const { submitBuyerRegistration, clients } = useStore();
  const { account } = useSession();
  const [open, setOpen] = React.useState(false);
  const [pid, setPid] = React.useState(projectId ?? projects[0].id);
  const project = projects.find((p) => p.id === pid)!;
  const mine = clients.filter((c) => c.agentId === account?.agentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader
          title="Submit a buyer registration"
          description="Registers your client with the sponsor and protects your commission for the registration window."
        />
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget as HTMLFormElement);
          submitBuyerRegistration({
            projectId: String(f.get("projectId")), clientId: String(f.get("clientId")),
            agentId: account?.agentId ?? "ag_schen", unitInterest: String(f.get("unitInterest")),
            note: String(f.get("note")),
          });
          setOpen(false);
        }}>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Project" className="sm:col-span-2">
              <NativeSelect name="projectId" value={pid} onChange={(e) => setPid(e.target.value)}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.neighborhood}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Client" className="sm:col-span-2">
              <NativeSelect name="clientId" required>
                {mine.length === 0 && <option value="">Add a client first</option>}
                {mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Unit interest" className="sm:col-span-2">
              <NativeSelect name="unitInterest" defaultValue={project.unitMix[0]?.type}>
                {project.unitMix.map((u) => <option key={u.type} value={`${u.type} — ${u.price}`}>{u.type} · {u.sqft} sf · {u.price}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Note to the sponsor" className="sm:col-span-2">
              <Textarea name="note" placeholder="Timeline, financing status, and when they toured." />
            </Field>
            <div className="sm:col-span-2 rounded-[10px] border border-line bg-canvas p-3.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-4">Commission terms</p>
              <p className="mt-1.5 text-[13px] text-ink-2">
                {project.commissionPct}% co-broke on contract price
                {project.bonus ? ` · ${project.bonus}` : ""} · registration valid 90 days
              </p>
              <p className="mt-1 text-[12.5px] text-ink-4">
                Price range {usd(project.priceMin)} – {usd(project.priceMax)} · {project.availableUnits} residences available
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit registration</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
