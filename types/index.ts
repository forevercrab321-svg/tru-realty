/* ============================================================================
   TRU REALTY — DOMAIN MODEL
   Every entity here maps 1:1 to a planned Postgres table. See /docs/data-model.md
   ========================================================================== */

export type ID = string;
export type ISODate = string;

/* ---------------------------------------------------------------- ORG / AUTH */

export type RoleKey =
  | "super_admin"
  | "brokerage_admin"
  | "transaction_coordinator"
  | "hr_ops"
  | "accounting"
  | "agent";

export type Permission =
  | "dashboard.view"
  | "agents.view" | "agents.edit"
  | "recruiting.view" | "recruiting.edit"
  | "transactions.view" | "transactions.edit"
  | "clients.view" | "clients.edit"
  | "listings.view" | "listings.edit"
  | "accounting.view" | "accounting.edit"
  | "commission.view" | "commission.edit"
  | "payouts.view" | "payouts.edit"
  | "events.view" | "events.manage"
  | "library.view" | "library.manage"
  | "performance.view"
  | "esign.view" | "esign.manage"
  | "company.settings"
  | "users.manage";

export interface Role {
  key: RoleKey;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  system: boolean;
}

export interface Office {
  id: ID;
  name: string;
  code: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  managingBroker: string;
  agentCount: number;
  opened: ISODate;
  timezone: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  role: RoleKey;
  title: string;
  officeId: ID;
  avatar: string;
  phone: string;
  lastActive: ISODate;
  agentId?: ID;
}

/* -------------------------------------------------------------------- AGENT */

export type AgentStatus = "active" | "onboarding" | "inactive" | "offboarding";
export type LicenseStatus = "active" | "expiring" | "expired" | "pending";
export type ProductionTier = "platinum" | "gold" | "silver" | "emerging";

export interface License {
  number: string;
  state: string;
  type: "Salesperson" | "Associate Broker" | "Broker";
  issued: ISODate;
  expires: ISODate;
  status: LicenseStatus;
  verifiedOn: ISODate | null;
  verifiedBy: string | null;
}

export interface MLSProfile {
  mlsId: string;
  board: string;
  status: "active" | "pending" | "inactive";
  associationDuesPaid: boolean;
  lastSync: ISODate;
}

export interface CommissionPlan {
  name: string;
  agentSplit: number;      // % to agent before caps
  brokerageSplit: number;
  cap: number;             // annual company-dollar cap
  capYtd: number;
  transactionFee: number;
  royaltyPct: number;
}

export interface Agent {
  id: ID;
  userId: ID;
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  avatar: string;
  officeId: ID;
  teamId: ID | null;
  status: AgentStatus;
  tier: ProductionTier;
  joinDate: ISODate;
  birthday: string;        // MM-DD
  bio: string;
  languages: string[];
  neighborhoods: string[];
  specialties: string[];
  license: License;
  mls: MLSProfile;
  plan: CommissionPlan;
  stats: {
    ytdVolume: number;
    ytdGci: number;
    ytdClosings: number;
    activeDeals: number;
    activeListings: number;
    lifetimeVolume: number;
    avgDaysOnMarket: number;
    listToSaleRatio: number;
    satisfaction: number;
  };
  onboardingStage?: OnboardingStage;
  emergencyContact?: { name: string; relation: string; phone: string };
  address?: string;
}

export interface Team {
  id: ID;
  name: string;
  leadAgentId: ID;
  memberIds: ID[];
  splitToTeam: number;
}

/* --------------------------------------------------------------- RECRUITING */

export type RecruitStage =
  | "new_lead" | "contacted" | "meeting_scheduled" | "interviewed"
  | "offer_sent" | "joined" | "not_interested";

export interface RecruitCandidate {
  id: ID;
  name: string;
  avatar: string;
  currentBrokerage: string;
  phone: string;
  email: string;
  yearsExperience: number;
  productionVolume: number;
  productionUnits: number;
  leadSource: "Referral" | "Inbound" | "Event" | "Cold Outreach" | "LinkedIn" | "MLS Data";
  recruiterId: ID;
  stage: RecruitStage;
  lastContact: ISODate;
  nextFollowUp: ISODate | null;
  notes: string;
  targetOfficeId: ID;
  createdAt: ISODate;
}

export type OnboardingStage =
  | "application" | "agreement_signed" | "license_verified" | "mls_setup"
  | "account_setup" | "training" | "ready_to_activate" | "active";

export interface OnboardingChecklistItem {
  key: string;
  label: string;
  done: boolean;
  completedOn: ISODate | null;
  owner: "Agent" | "HR" | "Broker" | "IT";
  required: boolean;
}

export interface OnboardingRecord {
  id: ID;
  agentId: ID;
  stage: OnboardingStage;
  startedAt: ISODate;
  targetActivation: ISODate;
  assignedTo: ID;
  checklist: OnboardingChecklistItem[];
}

/* -------------------------------------------------------------- CLIENTS/CRM */

export type ClientType = "buyer" | "seller" | "both" | "renter" | "investor";
export type ClientStatus =
  | "new_lead" | "nurturing" | "active" | "under_contract" | "closed" | "lost";

export interface Client {
  id: ID;
  name: string;
  type: ClientType;
  status: ClientStatus;
  email: string;
  phone: string;
  avatar: string;
  agentId: ID;
  budgetMin: number;
  budgetMax: number;
  areas: string[];
  propertyType: string;
  beds: number;
  leadSource: string;
  createdAt: ISODate;
  lastContact: ISODate;
  nextFollowUp: ISODate | null;
  notes: ClientNote[];
  tags: string[];
  preApproved?: boolean;
  lender?: string;
}

export interface ClientNote {
  id: ID;
  body: string;
  authorId: ID;
  createdAt: ISODate;
  type: "note" | "call" | "email" | "showing" | "meeting";
}

/* ------------------------------------------------------------- TRANSACTIONS */

export type TxStage =
  | "lead" | "offer" | "accepted" | "under_contract" | "inspection"
  | "appraisal" | "loan" | "final_walkthrough" | "closing" | "closed" | "cancelled";

export type TxSide = "listing" | "buyer" | "dual" | "rental";

export interface TransactionTask {
  id: ID;
  title: string;
  dueDate: ISODate;
  assigneeId: ID;
  status: "open" | "in_progress" | "done" | "overdue";
  priority: "low" | "medium" | "high";
  category: "compliance" | "closing" | "marketing" | "client" | "finance";
}

export interface TransactionDocument {
  id: ID;
  name: string;
  category: string;
  fileType: "pdf" | "docx" | "jpg" | "xlsx";
  sizeKb: number;
  uploadedBy: ID;
  uploadedAt: ISODate;
  status: "received" | "pending" | "rejected" | "signed";
  required: boolean;
}

export interface TimelineEvent {
  id: ID;
  label: string;
  date: ISODate;
  done: boolean;
  kind: "milestone" | "task" | "document" | "note";
  actorId?: ID;
  detail?: string;
}

export interface CommissionBreakdown {
  salePrice: number;
  grossCommissionPct: number;
  grossCommission: number;
  sideCommission: number;
  referralFeePct: number;
  referralFee: number;
  brokerageSplitPct: number;
  brokerageSplit: number;
  agentSplit: number;
  teamSplit: number;
  companyFee: number;
  transactionFee: number;
  netAgent: number;
  netBrokerage: number;
}

export interface Transaction {
  id: ID;
  ref: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unit?: string;
  propertyType: string;
  image: string;
  side: TxSide;
  stage: TxStage;
  agentId: ID;
  coAgentId: ID | null;
  coordinatorId: ID;
  clientId: ID;
  counterparty: string;
  counterpartyBrokerage: string;
  listPrice: number;
  salePrice: number;
  commissionPct: number;
  contractDate: ISODate | null;
  closingDate: ISODate;
  createdAt: ISODate;
  escrow: number;
  lender: string | null;
  titleCompany: string | null;
  tasks: TransactionTask[];
  documents: TransactionDocument[];
  timeline: TimelineEvent[];
  notes: ClientNote[];
  commission: CommissionBreakdown;
  complianceComplete: boolean;
  riskFlags: string[];
}

/* ------------------------------------------------------------------ LISTING */

export type ListingStatus =
  | "coming_soon" | "active" | "under_contract" | "pending" | "sold" | "withdrawn" | "expired";

export interface OpenHouse {
  id: ID;
  date: ISODate;
  start: string;
  end: string;
  hostAgentId: ID;
  registrations: number;
  attended: number | null;
}

export interface Listing {
  id: ID;
  mlsId: string;
  address: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string;
  price: number;
  originalPrice: number;
  status: ListingStatus;
  propertyType: "Condo" | "Co-op" | "Townhouse" | "Single Family" | "Multi-Family" | "Loft" | "New Development";
  beds: number;
  baths: number;
  halfBaths: number;
  sqft: number;
  lotSqft: number | null;
  yearBuilt: number;
  hoa: number | null;
  taxes: number;
  listingAgentId: ID;
  coListingAgentId: ID | null;
  listedOn: ISODate;
  daysOnMarket: number;
  images: string[];
  description: string;
  features: string[];
  views: number;
  saves: number;
  showings: number;
  offers: number;
  openHouses: OpenHouse[];
  featured: boolean;
}

/* ------------------------------------------------- NEW DEVELOPMENT PROJECTS */

export interface Project {
  id: ID;
  name: string;
  developer: string;
  city: string;
  state: string;
  neighborhood: string;
  image: string;
  priceMin: number;
  priceMax: number;
  totalUnits: number;
  availableUnits: number;
  commissionPct: number;
  bonus: string | null;
  status: "pre_construction" | "under_construction" | "now_selling" | "final_units" | "sold_out";
  completion: string;
  registrationRequired: boolean;
  description: string;
  amenities: string[];
  unitMix: { type: string; sqft: string; price: string; available: number }[];
}

export type RegistrationStatus =
  | "draft" | "submitted" | "approved" | "rejected" | "expired" | "signed";

export interface BuyerRegistration {
  id: ID;
  projectId: ID;
  clientId: ID;
  agentId: ID;
  status: RegistrationStatus;
  submittedAt: ISODate;
  expiresAt: ISODate;
  unitInterest: string;
  documents: { name: string; uploaded: boolean }[];
  note: string;
}

/* ------------------------------------------------------------------- EVENTS */

export type EventType =
  | "training" | "broker_meeting" | "open_house" | "company_event" | "webinar" | "community";

export interface BrokerageEvent {
  id: ID;
  name: string;
  type: EventType;
  date: ISODate;
  start: string;
  end: string;
  location: string;
  hostId: ID;
  capacity: number;
  registered: number;
  attended: number | null;
  description: string;
  resources: { name: string; type: string }[];
  ceCredits: number | null;
  officeId: ID | "all";
  waitlist: number;
}

export interface EventRegistration {
  id: ID;
  eventId: ID;
  agentId: ID;
  status: "registered" | "waitlisted" | "attended" | "cancelled" | "no_show";
  registeredAt: ISODate;
}

/* ------------------------------------------------------------------ LIBRARY */

export interface LibraryDoc {
  id: ID;
  title: string;
  category:
    | "Company Documents" | "Policies" | "Forms" | "Templates"
    | "Marketing Materials" | "Training Materials" | "Sales Resources";
  fileType: "pdf" | "docx" | "xlsx" | "pptx" | "mp4" | "zip";
  sizeKb: number;
  uploadedById: ID;
  updatedAt: ISODate;
  downloads: number;
  favorite: boolean;
  description: string;
  tags: string[];
}

/* --------------------------------------------------------------- E-SIGNATURE */

export type SignatureStatus =
  | "draft" | "sent" | "viewed" | "signed" | "completed" | "expired" | "declined";

export interface SignatureRequest {
  id: ID;
  documentName: string;
  templateId: ID | null;
  transactionId: ID | null;
  agentId: ID;
  recipients: { name: string; email: string; role: string; signed: boolean; signedAt: ISODate | null }[];
  status: SignatureStatus;
  sentAt: ISODate | null;
  completedAt: ISODate | null;
  expiresAt: ISODate;
  createdBy: ID;
}

export interface SignatureTemplate {
  id: ID;
  name: string;
  category: string;
  fields: number;
  usageCount: number;
  updatedAt: ISODate;
}

/* --------------------------------------------------------------- ACCOUNTING */

export interface AgentCharge {
  id: ID;
  agentId: ID;
  description: string;
  category: "E&O" | "Technology" | "Marketing" | "Desk Fee" | "MLS" | "Training" | "Other";
  amount: number;
  date: ISODate;
  status: "billed" | "paid" | "waived" | "past_due";
  transactionId?: ID;
}

export interface Payout {
  id: ID;
  agentId: ID;
  transactionId: ID | null;
  period: string;
  grossCommission: number;
  deductions: number;
  netPayout: number;
  method: "ACH" | "Check" | "Wire";
  status: "pending" | "approved" | "paid" | "on_hold";
  issuedAt: ISODate | null;
  reference: string;
}

export interface TaxRecord {
  agentId: ID;
  year: number;
  ytdCommission: number;
  ytdPaid: number;
  pending: number;
  form1099Status: "not_started" | "in_review" | "issued" | "corrected";
  tin: string;
  entityName: string;
}

/* ------------------------------------------------------- COMMS / SYSTEM */

export interface Announcement {
  id: ID;
  title: string;
  body: string;
  authorId: ID;
  publishedAt: ISODate;
  pinned: boolean;
  audience: "all" | "agents" | "admins";
  category: "Company" | "Compliance" | "Market" | "Product" | "Celebration";
}

export type NotificationKind =
  | "new_lead" | "transaction_update" | "document_request" | "closing_reminder"
  | "license_expiration" | "event_reminder" | "commission_payment" | "announcement";

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: ISODate;
  read: boolean;
  href: string;
  audience: RoleKey[];
}

export interface Vendor {
  id: ID;
  name: string;
  category: "Title" | "Lender" | "Inspection" | "Photography" | "Legal" | "Staging" | "Insurance";
  contact: string;
  phone: string;
  email: string;
  preferred: boolean;
  rating: number;
  transactions: number;
}

export interface TrainingRecord {
  id: ID;
  agentId: ID;
  course: string;
  provider: string;
  completedOn: ISODate | null;
  dueOn: ISODate | null;
  ceCredits: number;
  status: "completed" | "in_progress" | "not_started" | "overdue";
}

export interface Agreement {
  id: ID;
  agentId: ID;
  name: string;
  type: "ICA" | "W-9" | "Addendum" | "Team Agreement" | "Policy Ack" | "Commission Plan";
  signedOn: ISODate | null;
  expiresOn: ISODate | null;
  status: "signed" | "pending" | "expired";
  version: string;
}
