/**
 * New York City public records, read live from NYC Open Data.
 *
 * This is the one real-property data source the brokerage can use *today*, with no MLS
 * membership, no licence agreement and no vendor. It is city-published open data:
 *
 *   PLUTO   — every tax lot in the five boroughs: zoning, year built, floors, units,
 *             lot and building area, FAR, assessed value, and the assessment-roll owner.
 *   ACRIS   — recorded documents: deeds (with the price actually paid), mortgages, and
 *             the parties to each.
 *
 * WHAT THIS IS NOT. It is not listings. Nothing here says whether a property is for sale.
 * Active inventory belongs to the MLS (REBNY RLS, OneKey) and arrives through a licensed
 * IDX feed; scraping a portal for it would breach both that portal's terms and the MLS
 * licences the data came from, and would put the brokerage's own RLS participation at
 * risk. So this module answers "what is this building, and what has it sold for" — which
 * is most of what a client actually asks — and stays silent about what is on the market.
 *
 * NO DATABASE. Every call is a live query against the Socrata API, cached in memory for a
 * few minutes. That matters because the app is a static export with no persistence layer:
 * a bulk sync of 860,000 tax lots has nowhere to live, but a per-question lookup needs
 * nowhere to live. When persistence lands this can become a sync without the callers
 * changing.
 *
 * FAILURE IS NOT AN EXCEPTION. The city's API is occasionally slow and occasionally down.
 * Every function here resolves to a value that says so, so an assistant can tell the user
 * "the city records service did not answer" instead of the turn dying.
 */

const SOCRATA = "https://data.cityofnewyork.us/resource";

/** Dataset ids, all on NYC Open Data. Verified live against the 2026-07 refresh. */
const DATASET = {
  /** Primary Land Use Tax Lot Output — one row per tax lot. */
  pluto: "64uk-42ks",
  /** ACRIS Real Property Legals — maps a recorded document to a borough/block/lot. */
  acrisLegals: "8h5j-fqxa",
  /** ACRIS Real Property Master — the document itself: type, date, amount. */
  acrisMaster: "bnx9-e6tj",
  /** ACRIS Real Property Parties — who was on each side of the document. */
  acrisParties: "636b-3b5g",
} as const;

/**
 * A Socrata app token, if one has been configured. It is a rate-limit identifier rather
 * than a credential — it grants nothing — but it is still set by the gateway from its own
 * environment rather than shipped in the browser bundle, because there is no reason to
 * publish it and the rule about `NEXT_PUBLIC_*` is easier to keep when it has no
 * exceptions. Without a token the API still answers; it is just throttled per IP.
 */
let appToken: string | undefined;
export const setNycAppToken = (token: string | undefined) => {
  appToken = token && token.trim() ? token.trim() : undefined;
};

const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();

/** The city API is a dependency, not a guarantee. Everything it returns is wrapped. */
export type Fetched<T> = { ok: true; data: T } | { ok: false; note: string };

const unavailable = (note: string): { ok: false; note: string } => ({ ok: false, note });

async function query<T>(dataset: string, params: Record<string, string>): Promise<Fetched<T[]>> {
  const url = new URL(`${SOCRATA}/${dataset}.json`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const key = url.toString();

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { ok: true, data: hit.value as T[] };

  try {
    const res = await fetch(key, {
      headers: appToken ? { "X-App-Token": appToken } : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return unavailable(`NYC Open Data answered ${res.status}.`);
    const rows = (await res.json()) as T[];
    if (!Array.isArray(rows)) return unavailable("NYC Open Data returned an unexpected shape.");
    cache.set(key, { at: Date.now(), value: rows });
    return { ok: true, data: rows };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return unavailable(timedOut ? "NYC Open Data did not answer in time." : "NYC Open Data is unreachable.");
  }
}

/* ------------------------------------------------------------------ BOROUGHS */

/** PLUTO spells boroughs; ACRIS numbers them. Both appear in returned data. */
export const BOROUGHS = {
  MN: { name: "Manhattan", acris: "1" },
  BX: { name: "Bronx", acris: "2" },
  BK: { name: "Brooklyn", acris: "3" },
  QN: { name: "Queens", acris: "4" },
  SI: { name: "Staten Island", acris: "5" },
} as const;

export type BoroughCode = keyof typeof BOROUGHS;

const BOROUGH_ALIASES: Record<string, BoroughCode> = {
  MANHATTAN: "MN", MN: "MN", "NEW YORK": "MN", NYC: "MN",
  BROOKLYN: "BK", BK: "BK", KINGS: "BK",
  QUEENS: "QN", QN: "QN",
  BRONX: "BX", BX: "BX", "THE BRONX": "BX",
  "STATEN ISLAND": "SI", SI: "SI", RICHMOND: "SI",
};

export const boroughFrom = (input?: string | null): BoroughCode | undefined =>
  input ? BOROUGH_ALIASES[input.trim().toUpperCase()] : undefined;

/* ------------------------------------------------------- ADDRESS NORMALISATION */

/**
 * PLUTO writes addresses in one specific way and matches nothing else: directions spelled
 * out, ordinals stripped, street types expanded. "425 W 21st St" is stored as
 * "425 WEST 21 STREET". People type the first form, so it has to become the second before
 * it reaches the query, or every lookup misses and the assistant reports "no such
 * building" about a building that plainly exists.
 */
const STREET_TYPES: Record<string, string> = {
  ST: "STREET", STR: "STREET", "ST.": "STREET",
  AVE: "AVENUE", AV: "AVENUE", "AVE.": "AVENUE",
  BLVD: "BOULEVARD", BVD: "BOULEVARD",
  RD: "ROAD", PL: "PLACE", PLZ: "PLAZA", PKWY: "PARKWAY", PKY: "PARKWAY",
  DR: "DRIVE", CT: "COURT", LN: "LANE", TER: "TERRACE", TERR: "TERRACE",
  HWY: "HIGHWAY", SQ: "SQUARE", CIR: "CIRCLE", EXPY: "EXPRESSWAY",
};

const DIRECTIONS: Record<string, string> = {
  W: "WEST", E: "EAST", N: "NORTH", S: "SOUTH",
};

export function normalizeAddress(raw: string): { number: string; street: string } | null {
  let s = raw
    .toUpperCase()
    .replace(/[.,]/g, " ")
    // Unit designators never appear in PLUTO — a lot is a lot, not an apartment. "#" needs
    // its own branch: it is not a word character, so \b never matches in front of it.
    .replace(/(?:#|\b(?:APT|UNIT|STE|SUITE|FL|FLOOR|PH)\b)\s*[\w-]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const m = /^(\d+[A-Z]?(?:-\d+)?)\s+(.*)$/.exec(s);
  if (!m) return null;
  const number = m[1];
  s = m[2];

  const words = s.split(" ").filter(Boolean).map((w, i, arr) => {
    if (DIRECTIONS[w] && i === 0) return DIRECTIONS[w];
    // "21ST" -> "21", but never touch a word that is not an ordinal number.
    const ord = /^(\d+)(ST|ND|RD|TH)$/.exec(w);
    if (ord) return ord[1];
    if (i === arr.length - 1 && STREET_TYPES[w]) return STREET_TYPES[w];
    return w;
  });

  const street = words.join(" ").trim();
  return street ? { number, street } : null;
}

/** Socrata string literals are single-quoted; a stray quote would break the predicate. */
const sq = (v: string) => `'${v.replace(/'/g, "''")}'`;

/* ------------------------------------------------------------------- LOT FACTS */

export interface LotFacts {
  bbl: { borough: BoroughCode; block: string; lot: string };
  boroughName: string;
  address: string;
  zip: string | null;
  /** Department of Finance building class, e.g. "R4" walk-up co-op, "D1" elevator rental. */
  buildingClass: string | null;
  landUse: string | null;
  zoning: string | null;
  yearBuilt: number | null;
  yearAltered: number | null;
  floors: number | null;
  residentialUnits: number | null;
  totalUnits: number | null;
  lotAreaSqFt: number | null;
  buildingAreaSqFt: number | null;
  residentialAreaSqFt: number | null;
  commercialAreaSqFt: number | null;
  /** How much of the permitted floor area is already built, and how much is allowed. */
  builtFar: number | null;
  residentialFar: number | null;
  commercialFar: number | null;
  /** Assessed values are a tax figure, not a market figure. Labelled as such downstream. */
  assessedLand: number | null;
  assessedTotal: number | null;
  ownerOnTaxRoll: string | null;
  /** True when the row is a condominium billing lot, which aggregates many apartments. */
  isCondoBillingLot: boolean;
}

const num = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const zeroToNull = (n: number | null): number | null => (n === 0 ? null : n);

type PlutoRow = Record<string, string | undefined>;

const PLUTO_FIELDS = [
  "borough", "block", "lot", "address", "zipcode", "bldgclass", "landuse", "zonedist1",
  "yearbuilt", "yearalter1", "numfloors", "unitsres", "unitstotal", "lotarea", "bldgarea",
  "resarea", "comarea", "builtfar", "residfar", "commfar", "assessland", "assesstot",
  "ownername",
].join(",");

function toLotFacts(row: PlutoRow): LotFacts {
  const borough = (row.borough ?? "MN") as BoroughCode;
  const lot = row.lot ?? "";
  return {
    bbl: { borough, block: row.block ?? "", lot },
    boroughName: BOROUGHS[borough]?.name ?? borough,
    address: row.address ?? "",
    zip: row.zipcode || null,
    buildingClass: row.bldgclass || null,
    landUse: row.landuse || null,
    zoning: row.zonedist1 || null,
    // A condo billing lot carries yearbuilt 0; reporting "built in year 0" is worse than
    // reporting nothing, so zero becomes null everywhere it means "not recorded".
    yearBuilt: zeroToNull(num(row.yearbuilt)),
    yearAltered: zeroToNull(num(row.yearalter1)),
    floors: zeroToNull(num(row.numfloors)),
    residentialUnits: num(row.unitsres),
    totalUnits: num(row.unitstotal),
    lotAreaSqFt: zeroToNull(num(row.lotarea)),
    buildingAreaSqFt: zeroToNull(num(row.bldgarea)),
    residentialAreaSqFt: zeroToNull(num(row.resarea)),
    commercialAreaSqFt: zeroToNull(num(row.comarea)),
    builtFar: num(row.builtfar),
    residentialFar: num(row.residfar),
    commercialFar: num(row.commfar),
    assessedLand: zeroToNull(num(row.assessland)),
    assessedTotal: zeroToNull(num(row.assesstot)),
    ownerOnTaxRoll: row.ownername || null,
    // 75xx is the Department of Finance's range for condominium billing lots.
    isCondoBillingLot: /^75\d\d$/.test(lot),
  };
}

/** Find tax lots matching a street address. Returns several when the address is ambiguous. */
export async function findLots(address: string, borough?: BoroughCode, limit = 5): Promise<Fetched<LotFacts[]>> {
  const parsed = normalizeAddress(address);
  if (!parsed) return unavailable("That does not look like a street address — a house number is needed.");

  const clauses = [`address like ${sq(`${parsed.number} ${parsed.street}%`)}`];
  if (borough) clauses.push(`borough = ${sq(borough)}`);

  const first = await query<PlutoRow>(DATASET.pluto, {
    $select: PLUTO_FIELDS,
    $where: clauses.join(" AND "),
    $limit: String(limit),
  });
  if (!first.ok) return first;
  if (first.data.length) return { ok: true, data: first.data.map(toLotFacts) };

  // Second pass: the street type may be wrong or absent ("84 India" for "84 INDIA STREET",
  // or "1 Park Av" where the type was already expanded). Match on the first word only.
  const head = parsed.street.split(" ")[0];
  const wide = [`address like ${sq(`${parsed.number} ${head}%`)}`];
  if (borough) wide.push(`borough = ${sq(borough)}`);

  const second = await query<PlutoRow>(DATASET.pluto, {
    $select: PLUTO_FIELDS,
    $where: wide.join(" AND "),
    $limit: String(limit),
  });
  if (!second.ok) return second;

  // The wide pass matches on house number plus the FIRST WORD of the street, so
  // "301 East 79 Street" also matches 301 East 21st and 301 East 45th. Callers take
  // `data[0]`, which meant a confident answer about a different building — its owner, its
  // deeds, its mortgages. Keep only rows whose street actually starts with what was asked
  // for; an empty result and an honest "not found" is the correct answer here.
  const wanted = `${parsed.number} ${parsed.street}`;
  const plausible = second.data.filter((r) => {
    const addr = (r.address ?? "").toUpperCase();
    return addr.startsWith(wanted) || addr === `${parsed.number} ${head}`;
  });
  return { ok: true, data: plausible.map(toLotFacts) };
}

/** Read one lot directly when the borough/block/lot is already known. */
export async function lotByBbl(borough: BoroughCode, block: string, lot: string): Promise<Fetched<LotFacts | null>> {
  const res = await query<PlutoRow>(DATASET.pluto, {
    $select: PLUTO_FIELDS,
    $where: `borough = ${sq(borough)} AND block = ${sq(block)} AND lot = ${sq(lot)}`,
    $limit: "1",
  });
  if (!res.ok) return res;
  return { ok: true, data: res.data.length ? toLotFacts(res.data[0]) : null };
}

/* -------------------------------------------------------------- RECORDED DOCS */

export interface RecordedDocument {
  documentId: string;
  /** DEED, MTGE (mortgage), SAT (satisfaction), AGMT, and so on. */
  docType: string;
  /** When it was signed. */
  date: string | null;
  /** When the City recorded it — the date a title search keys on. */
  recordedAt: string | null;
  /** Consideration for a deed, principal for a mortgage. Zero often means a non-sale. */
  amount: number | null;
}

type MasterRow = Record<string, string | undefined>;
type LegalRow = Record<string, string | undefined>;
type PartyRow = Record<string, string | undefined>;

const iso = (v: string | undefined): string | null => (v ? v.slice(0, 10) : null);

/**
 * Every recorded document touching a lot, newest first.
 *
 * ACRIS is normalised across three datasets, so this is two round trips: legals maps
 * borough/block/lot to document ids, master carries the type, date and amount. The `in`
 * predicate needs a space after `in` — without it Socrata silently ignores the clause and
 * returns the head of the whole table, which looks like data and is not.
 */
export async function recordedDocuments(
  borough: BoroughCode,
  block: string,
  lot: string,
  limit = 40,
): Promise<Fetched<RecordedDocument[]>> {
  const acrisBorough = BOROUGHS[borough].acris;

  const legals = await query<LegalRow>(DATASET.acrisLegals, {
    $select: "document_id,good_through_date",
    $where: `borough = ${sq(acrisBorough)} AND block = ${sq(block)} AND lot = ${sq(lot)}`,
    // Newest first. Without an $order Socrata returns rows in its own order — roughly
    // oldest first — so on a building with hundreds of recorded documents (any condo, any
    // pre-war co-op) the "most recent deed" was the newest of the OLDEST few hundred. A
    // 1987 deed was being reported as the last sale, and 1980s mortgages as current
    // encumbrances, with no caveat.
    $order: "good_through_date DESC",
    $limit: String(limit * 3),
  });
  if (!legals.ok) return legals;

  const ids = [...new Set(legals.data.map((r) => r.document_id).filter(Boolean))] as string[];
  if (!ids.length) return { ok: true, data: [] };

  const master = await query<MasterRow>(DATASET.acrisMaster, {
    $select: "document_id,doc_type,document_date,document_amt,recorded_datetime",
    $where: `document_id in (${ids.map(sq).join(",")})`,
    $order: "recorded_datetime DESC",
    $limit: String(ids.length),
  });
  if (!master.ok) return master;

  const docs: RecordedDocument[] = master.data.map((r) => ({
    documentId: r.document_id ?? "",
    docType: r.doc_type ?? "",
    date: iso(r.document_date),
    recordedAt: iso(r.recorded_datetime),
    amount: num(r.document_amt),
  }));

  docs.sort((a, b) => (b.recordedAt ?? "").localeCompare(a.recordedAt ?? ""));
  return { ok: true, data: docs.slice(0, limit) };
}

/** Deeds only, and only those with a price — the actual sale history of a lot. */
export const salesFrom = (docs: RecordedDocument[]): RecordedDocument[] =>
  docs.filter((d) => d.docType === "DEED" && (d.amount ?? 0) > 0);

/** Mortgages recorded against a lot, newest first. */
export const mortgagesFrom = (docs: RecordedDocument[]): RecordedDocument[] =>
  docs.filter((d) => d.docType === "MTGE" && (d.amount ?? 0) > 0);

export interface DocumentParty {
  /** "1" is the party granting (seller, borrower); "2" is the party receiving. */
  side: "grantor" | "grantee" | "other";
  name: string;
}

/**
 * The parties to a recorded document.
 *
 * ACRIS also publishes each party's mailing address. This function drops it, at every
 * tier, deliberately. The brokerage has no task that needs a named individual's home
 * address, and an assistant that will read one out on request is a tool for compiling a
 * list of people to contact at home. Names are returned; where they live is not.
 */
export async function documentParties(documentId: string): Promise<Fetched<DocumentParty[]>> {
  const res = await query<PartyRow>(DATASET.acrisParties, {
    $select: "document_id,party_type,name",
    $where: `document_id = ${sq(documentId)}`,
    $limit: "20",
  });
  if (!res.ok) return res;
  return {
    ok: true,
    data: res.data.map((r) => ({
      side: (r.party_type === "1" ? "grantor" : r.party_type === "2" ? "grantee" : "other") as DocumentParty["side"],
      name: r.name ?? "",
    })).filter((p) => p.name),
  };
}

/* ------------------------------------------------------------------- ANALYSIS */

/**
 * Unused development rights, in square feet of floor area.
 *
 * `residfar` is what the zoning permits; `builtfar` is what stands. The gap, multiplied by
 * the lot area, is the air rights — the number that decides whether a low building on a
 * high-density lot is worth more than the building on it. Returns null rather than a
 * guess when either figure is missing, which is common on condo billing lots.
 */
export function unusedFloorArea(lot: LotFacts): number | null {
  if (lot.residentialFar === null || lot.builtFar === null || lot.lotAreaSqFt === null) return null;
  // A PLUTO `builtfar` of 0 means "not recorded" far more often than it means "vacant" —
  // it is 0 on condo billing lots and wherever the building area is missing. Treating it
  // as a real zero reported a fully built site as having its entire envelope available:
  // residfar 4.0 on a 2,500 sq ft lot came back as "about 10,000 sq ft of unused floor
  // area". The row's own buildingAreaSqFt is nulled for exactly this reason (zeroToNull);
  // this figure has to agree with it.
  if (lot.builtFar === 0 && lot.buildingAreaSqFt === null) return null;
  if (lot.residentialFar === 0) return null;
  const gap = lot.residentialFar - lot.builtFar;
  if (gap <= 0) return 0;
  return Math.round(gap * lot.lotAreaSqFt);
}

/** A human label for the DOF building class prefix, which is otherwise opaque. */
export function buildingClassLabel(code: string | null): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    A: "One-family house", B: "Two-family house", C: "Walk-up apartments",
    D: "Elevator apartments", E: "Warehouse", F: "Factory or industrial",
    G: "Garage or gas station", H: "Hotel", I: "Health facility",
    J: "Theatre", K: "Store building", L: "Loft", M: "Religious facility",
    N: "Asylum or home", O: "Office building", P: "Place of assembly",
    Q: "Outdoor recreation", R: "Condominium", S: "Mixed residential and commercial",
    T: "Transportation facility", U: "Utility", V: "Vacant land",
    W: "Educational facility", Y: "Government facility", Z: "Miscellaneous",
  };
  return map[code[0]] ?? null;
}
