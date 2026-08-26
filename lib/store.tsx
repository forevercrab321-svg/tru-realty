"use client";
import * as React from "react";
import { toast } from "sonner";
import type {
  AppNotification, BrokerageEvent, BuyerRegistration, Client, ClientNote, EventRegistration,
  LibraryDoc, Listing, RecruitCandidate, RecruitStage, SignatureRequest, Transaction,
  TransactionDocument, TransactionTask, TxStage,
} from "@/types";
import * as seed from "@/data";
import { uid } from "./utils";
import { computeCommission } from "./commission";

/**
 * In-memory application store.
 *
 * Every mutation below is intentionally shaped like the server action that will
 * replace it (same arguments, same return contract). Swapping the mock for
 * Supabase means re-implementing the bodies, not the call sites.
 * See /docs/product-architecture.md § Data Layer.
 */

type State = {
  transactions: Transaction[];
  clients: Client[];
  listings: Listing[];
  recruits: RecruitCandidate[];
  events: BrokerageEvent[];
  eventRegistrations: EventRegistration[];
  buyerRegistrations: BuyerRegistration[];
  signatureRequests: SignatureRequest[];
  libraryDocs: LibraryDoc[];
  notifications: AppNotification[];
};

type Actions = {
  createClient: (input: Partial<Client> & { name: string; agentId: string }) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  addClientNote: (clientId: string, note: Omit<ClientNote, "id" | "createdAt">) => void;

  createTransaction: (input: {
    address: string; city: string; zip: string; propertyType: string; side: Transaction["side"];
    agentId: string; clientId: string; listPrice: number; commissionPct: number; closingDate: string;
    coordinatorId?: string;
  }) => Transaction;
  moveTransactionStage: (id: string, stage: TxStage) => void;
  addTransactionTask: (txId: string, task: Omit<TransactionTask, "id">) => void;
  toggleTask: (txId: string, taskId: string) => void;
  addTransactionDocument: (txId: string, doc: Pick<TransactionDocument, "name" | "category" | "fileType" | "sizeKb">, byId: string) => void;
  addTransactionNote: (txId: string, body: string, authorId: string) => void;

  createListing: (input: Partial<Listing> & { address: string; city: string; price: number; listingAgentId: string }) => Listing;
  updateListingStatus: (id: string, status: Listing["status"]) => void;

  moveRecruitStage: (id: string, stage: RecruitStage) => void;
  createRecruit: (input: Partial<RecruitCandidate> & { name: string; recruiterId: string }) => void;

  createEvent: (input: Omit<BrokerageEvent, "id" | "registered" | "attended" | "waitlist" | "resources"> & { resources?: BrokerageEvent["resources"] }) => void;
  rsvp: (eventId: string, agentId: string) => void;
  cancelRsvp: (eventId: string, agentId: string) => void;

  submitBuyerRegistration: (input: { projectId: string; clientId: string; agentId: string; unitInterest: string; note: string }) => void;

  toggleFavoriteDoc: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
};

const initial = (): State => ({
  transactions: seed.transactions,
  clients: seed.clients,
  listings: seed.listings,
  recruits: seed.recruits,
  events: seed.events,
  eventRegistrations: seed.eventRegistrations,
  buyerRegistrations: seed.buyerRegistrations,
  signatureRequests: seed.signatureRequests,
  libraryDocs: seed.libraryDocs,
  notifications: seed.notifications,
});

const Ctx = React.createContext<(State & Actions) | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(initial);

  const actions = React.useMemo<Actions>(() => ({
    createClient(input) {
      const client: Client = {
        id: uid("cl"), name: input.name, type: input.type ?? "buyer", status: input.status ?? "new_lead",
        email: input.email ?? "", phone: input.phone ?? "", avatar: "", agentId: input.agentId,
        budgetMin: input.budgetMin ?? 0, budgetMax: input.budgetMax ?? 0, areas: input.areas ?? [],
        propertyType: input.propertyType ?? "Condo", beds: input.beds ?? 1,
        leadSource: input.leadSource ?? "Manual Entry", createdAt: "2026-08-26", lastContact: "2026-08-26",
        nextFollowUp: input.nextFollowUp ?? null, notes: [], tags: input.tags ?? [],
        preApproved: input.preApproved, lender: input.lender,
      };
      setState((s) => ({ ...s, clients: [client, ...s.clients] }));
      toast.success("Client created", { description: `${client.name} was added to your database.` });
      return client;
    },

    updateClient(id, patch) {
      setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      toast.success("Client updated");
    },

    addClientNote(clientId, note) {
      setState((s) => ({
        ...s,
        clients: s.clients.map((c) => c.id === clientId
          ? { ...c, lastContact: "2026-08-26", notes: [{ ...note, id: uid("n"), createdAt: "2026-08-26" }, ...c.notes] }
          : c),
      }));
      toast.success("Activity logged");
    },

    createTransaction(input) {
      const n = 1065 + state.transactions.filter((t) => t.ref.startsWith("TR-2026")).length;
      const commission = computeCommission({
        salePrice: input.listPrice, grossCommissionPct: input.commissionPct,
        sidePct: input.side === "dual" ? 1 : 0.5, agentId: input.agentId,
      });
      const tx: Transaction = {
        id: uid("tx"), ref: `TR-2026-${n}`, address: input.address, city: input.city, state: "NY",
        zip: input.zip, propertyType: input.propertyType, image: "/listings/l3-1.svg",
        side: input.side, stage: "lead", agentId: input.agentId, coAgentId: null,
        coordinatorId: input.coordinatorId ?? "usr_tc_reeves", clientId: input.clientId,
        counterparty: "—", counterpartyBrokerage: "—", listPrice: input.listPrice, salePrice: 0,
        commissionPct: input.commissionPct, contractDate: null, closingDate: input.closingDate,
        createdAt: "2026-08-26", escrow: Math.round(input.listPrice * 0.1), lender: null, titleCompany: null,
        tasks: [
          { id: uid("t"), title: "Confirm agency disclosure signed", dueDate: "2026-09-02", assigneeId: input.agentId, status: "open", priority: "high", category: "compliance" },
          { id: uid("t"), title: "Upload executed listing or buyer agreement", dueDate: "2026-09-04", assigneeId: input.agentId, status: "open", priority: "high", category: "compliance" },
        ],
        documents: [], timeline: [{ id: uid("m"), label: "Opportunity created", date: "2026-08-26", done: true, kind: "milestone", actorId: input.agentId }],
        notes: [], commission, complianceComplete: false, riskFlags: ["Agreement not yet on file"],
      };
      setState((s) => ({ ...s, transactions: [tx, ...s.transactions] }));
      toast.success("Transaction created", { description: `${tx.ref} · ${tx.address} — now at the top of your list.` });
      return tx;
    },

    moveTransactionStage(id, stage) {
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => t.id === id ? {
          ...t, stage,
          timeline: [...t.timeline, { id: uid("m"), label: `Moved to ${stage.replace(/_/g, " ")}`, date: "2026-08-26", done: true, kind: "milestone" as const, actorId: t.agentId }],
        } : t),
      }));
      toast.success("Stage updated", { description: `Moved to ${stage.replace(/_/g, " ")}.` });
    },

    addTransactionTask(txId, task) {
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => t.id === txId ? { ...t, tasks: [...t.tasks, { ...task, id: uid("t") }] } : t),
      }));
      toast.success("Task added");
    },

    toggleTask(txId, taskId) {
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => t.id === txId ? {
          ...t, tasks: t.tasks.map((k) => k.id === taskId ? { ...k, status: k.status === "done" ? "open" : "done" } : k),
        } : t),
      }));
    },

    addTransactionDocument(txId, doc, byId) {
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => t.id === txId ? {
          ...t,
          documents: [...t.documents, { ...doc, id: uid("d"), uploadedBy: byId, uploadedAt: "2026-08-26", status: "received" as const, required: false }],
        } : t),
      }));
      toast.success("Document uploaded", { description: doc.name });
    },

    addTransactionNote(txId, body, authorId) {
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => t.id === txId ? {
          ...t, notes: [{ id: uid("n"), body, authorId, createdAt: "2026-08-26", type: "note" as const }, ...t.notes],
        } : t),
      }));
      toast.success("Note added");
    },

    createListing(input) {
      const listing: Listing = {
        id: uid("ls"), mlsId: `RLS-${Math.floor(2260000 + Math.random() * 9999)}`, address: input.address,
        unit: input.unit, city: input.city, state: "NY", zip: input.zip ?? "10010",
        neighborhood: input.neighborhood ?? input.city, price: input.price, originalPrice: input.price,
        status: input.status ?? "coming_soon", propertyType: input.propertyType ?? "Condo",
        beds: input.beds ?? 2, baths: input.baths ?? 2, halfBaths: 0, sqft: input.sqft ?? 1000,
        lotSqft: null, yearBuilt: input.yearBuilt ?? 2015, hoa: input.hoa ?? null, taxes: input.taxes ?? 0,
        listingAgentId: input.listingAgentId, coListingAgentId: null, listedOn: "2026-08-26", daysOnMarket: 0,
        images: ["/listings/l6-1.svg", "/listings/l6-2.svg", "/listings/l6-3.svg"],
        description: input.description ?? "", features: input.features ?? [], views: 0, saves: 0,
        showings: 0, offers: 0, openHouses: [], featured: false,
      };
      setState((s) => ({ ...s, listings: [listing, ...s.listings] }));
      toast.success("Listing created", { description: `${listing.address} is now in Coming Soon.` });
      return listing;
    },

    updateListingStatus(id, status) {
      setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === id ? { ...l, status } : l)) }));
      toast.success("Listing status updated");
    },

    moveRecruitStage(id, stage) {
      setState((s) => ({ ...s, recruits: s.recruits.map((r) => (r.id === id ? { ...r, stage, lastContact: "2026-08-26" } : r)) }));
      toast.success("Candidate moved", { description: stage.replace(/_/g, " ") });
    },

    createRecruit(input) {
      const r: RecruitCandidate = {
        id: uid("rc"), name: input.name, avatar: "", currentBrokerage: input.currentBrokerage ?? "—",
        phone: input.phone ?? "", email: input.email ?? "", yearsExperience: input.yearsExperience ?? 0,
        productionVolume: input.productionVolume ?? 0, productionUnits: input.productionUnits ?? 0,
        leadSource: input.leadSource ?? "Inbound", recruiterId: input.recruiterId, stage: "new_lead",
        lastContact: "2026-08-26", nextFollowUp: input.nextFollowUp ?? null,
        notes: input.notes ?? "", targetOfficeId: input.targetOfficeId ?? "of_flatiron", createdAt: "2026-08-26",
      };
      setState((s) => ({ ...s, recruits: [r, ...s.recruits] }));
      toast.success("Candidate added to pipeline");
    },

    createEvent(input) {
      const e: BrokerageEvent = { ...input, id: uid("ev"), registered: 0, attended: null, waitlist: 0, resources: input.resources ?? [] };
      setState((s) => ({ ...s, events: [...s.events, e] }));
      toast.success("Event published", { description: e.name });
    },

    rsvp(eventId, agentId) {
      setState((s) => {
        const ev = s.events.find((e) => e.id === eventId);
        if (!ev) return s;
        const full = ev.registered >= ev.capacity;
        return {
          ...s,
          events: s.events.map((e) => e.id === eventId
            ? { ...e, registered: full ? e.registered : e.registered + 1, waitlist: full ? e.waitlist + 1 : e.waitlist }
            : e),
          eventRegistrations: [
            ...s.eventRegistrations,
            { id: uid("er"), eventId, agentId, status: full ? "waitlisted" as const : "registered" as const, registeredAt: "2026-08-26" },
          ],
        };
      });
      toast.success("You're registered", { description: "A calendar invite is on its way." });
    },

    cancelRsvp(eventId, agentId) {
      setState((s) => ({
        ...s,
        events: s.events.map((e) => (e.id === eventId ? { ...e, registered: Math.max(0, e.registered - 1) } : e)),
        eventRegistrations: s.eventRegistrations.filter((r) => !(r.eventId === eventId && r.agentId === agentId)),
      }));
      toast("Registration cancelled");
    },

    submitBuyerRegistration(input) {
      const reg: BuyerRegistration = {
        id: uid("br"), projectId: input.projectId, clientId: input.clientId, agentId: input.agentId,
        status: "submitted", submittedAt: "2026-08-26", expiresAt: "2026-11-24",
        unitInterest: input.unitInterest, note: input.note,
        documents: [
          { name: "Buyer Registration Form", uploaded: true },
          { name: "Pre-Approval Letter", uploaded: false },
          { name: "Photo ID", uploaded: false },
        ],
      };
      setState((s) => ({ ...s, buyerRegistrations: [reg, ...s.buyerRegistrations] }));
      toast.success("Registration submitted", { description: "The sponsor typically responds within 2 business days." });
    },

    toggleFavoriteDoc(id) {
      setState((s) => ({ ...s, libraryDocs: s.libraryDocs.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d)) }));
    },

    markNotificationRead(id) {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    },

    markAllNotificationsRead() {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    },

    resetDemoData() {
      setState(initial());
      toast.success("Demo data reset");
    },
  }), [state.transactions]);

  return <Ctx.Provider value={{ ...state, ...actions }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
