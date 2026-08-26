import type { Listing, ListingStatus, OpenHouse } from "@/types";

type L = [
  id: string, mls: string, address: string, unit: string, city: string, zip: string,
  hood: string, price: number, orig: number, status: ListingStatus, ptype: Listing["propertyType"],
  beds: number, baths: number, half: number, sqft: number, lot: number | null, year: number,
  hoa: number | null, taxes: number, agent: string, listed: string, img: number,
  featured: boolean, desc: string, feats: string[]
];

const rows: L[] = [
  ["ls_1", "RLS-2261044", "36 Gramercy Park East", "10A", "New York", "10003", "Gramercy Park", 6_750_000, 6_750_000, "coming_soon", "Condo", 4, 3, 1, 3120, null, 1928, 4890, 38400, "ag_schen", "2026-08-18", 11, true,
    "A full-floor residence on the park with keyed access, restored casement windows and 11-foot beamed ceilings. Renovated in 2023 by Studio Halloran.",
    ["Park Views", "Private Elevator Landing", "Wood-Burning Fireplace", "Central Air", "Washer/Dryer", "Keyed Park Access"]],
  ["ls_2", "RLS-2258812", "2 Bond Street", "5W", "New York", "10012", "NoHo", 5_450_000, 5_950_000, "sold", "Loft", 3, 2, 1, 2740, null, 1901, 3200, 29100, "ag_jwang", "2026-01-20", 16, false,
    "A true NoHo artist's loft with 60 feet of southern exposure, original tin ceilings and a chef's kitchen by Boffi.", ["Loft Ceilings", "South Exposure", "Chef's Kitchen", "Original Details", "Elevator Building"]],
  ["ls_3", "RLS-2263190", "150 West 12th Street", "8C", "New York", "10011", "West Village", 3_295_000, 3_295_000, "active", "Co-op", 2, 2, 0, 1480, null, 1931, 3650, 0, "ag_jwang", "2026-07-29", 3, true,
    "A pre-war corner residence in a full-service Village co-op, with treetop views over West 12th and a windowed kitchen.", ["Pre-War Details", "Corner Unit", "Full-Service Building", "Roof Deck", "Pets Allowed"]],
  ["ls_4", "OK-8829104", "620 Carroll Street", "", "Brooklyn", "11215", "Park Slope", 4_395_000, 4_595_000, "under_contract", "Townhouse", 5, 3, 2, 4100, 2000, 1899, null, 22400, "ag_jocallahan", "2026-03-27", 4, true,
    "A 20-foot limestone in the Park Slope Historic District, delivered as a two-family with an owner's triplex and a garden-level rental.", ["Historic District", "Garden", "Two-Family", "Original Millwork", "Radiant Heat"]],
  ["ls_5", "OK-8831277", "212 Java Street", "", "Brooklyn", "11222", "Greenpoint", 2_950_000, 2_950_000, "under_contract", "Multi-Family", 6, 4, 0, 3600, 2500, 1930, null, 14800, "ag_mrodriguez", "2026-04-11", 3, false,
    "A well-maintained three-family a block from the East River waterfront, fully occupied with upside on two units at lease turnover.", ["Three-Family", "Fully Occupied", "Rear Yard", "Separate Utilities", "Near Ferry"]],
  ["ls_6", "OK-8842019", "1140 Northern Boulevard", "", "Manhasset", "11030", "Manhasset", 2_195_000, 2_195_000, "active", "Single Family", 5, 4, 1, 4250, 18000, 1996, null, 31200, "ag_ejohnson", "2026-07-14", 10, true,
    "A center-hall colonial on nearly half an acre in the Munsey Park school district, with a 2023 kitchen and a heated gunite pool.", ["Pool", "Half Acre", "Munsey Park Schools", "3-Car Garage", "Finished Basement"]],
  ["ls_7", "RLS-2259901", "45 East 22nd Street", "31B", "New York", "10010", "Flatiron", 3_895_000, 3_895_000, "under_contract", "Condo", 3, 3, 0, 1920, null, 2017, 2980, 26400, "ag_schen", "2026-06-02", 1, false,
    "High-floor corner three-bedroom in Madison Square Park Tower with 360-degree light and a full suite of building amenities.", ["Park Views", "Corner Unit", "Doorman", "Fitness Center", "Residents Lounge"]],
  ["ls_8", "OK-8845513", "9 Sutton Place", "", "Great Neck", "11021", "Great Neck", 2_875_000, 3_100_000, "under_contract", "Single Family", 6, 5, 1, 5400, 22000, 2004, null, 42800, "ag_lbianchi", "2026-05-30", 22, false,
    "A stone-and-shingle colonial on a half-acre with a two-story entry, primary suite with sitting room, and a resort-grade backyard.", ["Half Acre", "Pool & Spa", "Home Theater", "Generator", "Great Neck Schools"]],
  ["ls_9", "RLS-2264402", "530 West 145th Street", "2A", "New York", "10031", "Hamilton Heights", 675_000, 675_000, "active", "Co-op", 2, 1, 0, 980, null, 1924, 1180, 0, "ag_rmensah", "2026-08-22", 23, false,
    "An income-restricted HDFC two-bedroom with pre-war proportions, high ceilings and a renovated kitchen. Income caps apply.", ["HDFC", "Pre-War", "High Ceilings", "Low Maintenance", "Near A/C/1 Trains"]],
  ["ls_10", "OK-8846620", "42-15 Crescent Street", "9F", "Queens", "11101", "Long Island City", 899_000, 899_000, "under_contract", "Condo", 2, 2, 0, 1010, null, 2025, 890, 1240, "ag_dpark", "2026-07-05", 7, true,
    "New construction at Skyline Court with a private balcony, Manhattan skyline views and a 15-year 421-a tax abatement.", ["New Construction", "Tax Abatement", "Balcony", "Skyline Views", "Roof Deck"]],
  ["ls_11", "OK-8847788", "70-31 108th Street", "4B", "Queens", "11375", "Forest Hills", 749_000, 775_000, "under_contract", "Co-op", 2, 2, 0, 1250, null, 1958, 1420, 0, "ag_ntran", "2026-06-16", 15, false,
    "A rarely available corner two-bedroom in a well-capitalized Forest Hills co-op with a live-in super and garage waitlist.", ["Corner Unit", "Live-In Super", "Garage", "Storage", "Near E/F Trains"]],
  ["ls_12", "OK-8849001", "544 Bushwick Avenue", "", "Brooklyn", "11206", "Bushwick", 3_450_000, 3_450_000, "pending", "Multi-Family", 8, 6, 0, 5200, 3000, 1912, null, 19600, "ag_mrodriguez", "2026-03-30", 12, false,
    "A four-family with a clean rent roll and a delivered vacant garden unit, positioned two blocks from the Flushing Avenue L.", ["Four-Family", "Vacant Unit at Closing", "Rent Roll Provided", "Near L Train"]],
  ["ls_13", "RLS-2265120", "19 Bedford Street", "", "New York", "10014", "West Village", 4_995_000, 4_995_000, "under_contract", "Townhouse", 4, 3, 1, 3200, 1600, 1849, null, 34200, "ag_jwang", "2026-06-24", 8, true,
    "A Greek Revival single-family on one of the Village's most protected blocks, with a landscaped garden and a finished cellar.", ["Single-Family", "Landmarked", "Private Garden", "Fireplaces", "Finished Cellar"]],
  ["ls_14", "OK-8851440", "18 Chestnut Lane", "", "Rockville Centre", "11570", "Rockville Centre", 1_179_000, 1_179_000, "sold", "Single Family", 4, 2, 1, 2400, 8000, 1958, null, 18900, "ag_ejohnson", "2026-02-12", 18, false,
    "An expanded ranch on a quiet cul-de-sac with an open kitchen-family room and a level, fenced yard.", ["Cul-de-Sac", "Open Plan", "Fenced Yard", "Central Air", "Attached Garage"]],
  ["ls_15", "RLS-2266001", "88 Franklin Street", "PH", "New York", "10013", "Tribeca", 8_450_000, 8_950_000, "under_contract", "Loft", 4, 4, 1, 4380, null, 1888, 5400, 51200, "ag_jwang", "2026-05-19", 2, true,
    "A penthouse loft with a 1,200 sq ft private terrace, 14-foot ceilings and a restored cast-iron facade.", ["Private Terrace", "14' Ceilings", "Cast-Iron Facade", "Private Elevator", "Skylights"]],
  ["ls_16", "OK-8853302", "77 Crown Street", "3R", "Brooklyn", "11225", "Crown Heights", 869_000, 869_000, "under_contract", "Condo", 2, 2, 0, 1080, null, 2021, 610, 980, "ag_cwhite", "2026-07-01", 13, false,
    "A boutique-condo two-bedroom with a chef's kitchen, in-unit laundry and a shared roof deck facing the Botanic Garden.", ["In-Unit Laundry", "Roof Deck", "Tax Abatement", "Bike Room", "Near 2/3/4/5"]],
  ["ls_17", "RLS-2266440", "301 East 79th Street", "14C", "New York", "10075", "Yorkville", 1_595_000, 1_695_000, "pending", "Co-op", 2, 2, 0, 1340, null, 1962, 2890, 0, "ag_apatel", "2026-04-08", 6, false,
    "A high-floor two-bedroom with open city views in a full-service Yorkville co-op with a garage and roof deck.", ["City Views", "Full-Service", "Garage", "Roof Deck", "Storage"]],
  ["ls_18", "OK-8855119", "127 Sherman Avenue", "", "Garden City", "11530", "Garden City", 1_349_000, 1_349_000, "pending", "Single Family", 4, 3, 0, 2850, 9000, 1929, null, 24100, "ag_ejohnson", "2026-05-02", 5, false,
    "A classic Garden City colonial with original leaded glass, a renovated primary bath and a detached two-car garage.", ["Original Details", "Renovated Baths", "2-Car Garage", "Walk to LIRR", "Garden City Schools"]],
  ["ls_19", "RLS-2267220", "255 East 34th Street", "8H", "New York", "10016", "Kips Bay", 1_425_000, 1_425_000, "under_contract", "Co-op", 2, 1, 1, 1120, null, 1965, 2340, 0, "ag_dkim", "2026-05-14", 9, false,
    "A renovated two-bedroom in a Kips Bay co-op with a 24-hour doorman, on-site garage and a landscaped roof terrace.", ["Renovated", "24-Hour Doorman", "Roof Terrace", "Garage", "Pied-à-Terre OK"]],
  ["ls_20", "OK-8856700", "84 India Street", "", "Brooklyn", "11222", "Greenpoint", 1_895_000, 1_895_000, "active", "Townhouse", 3, 2, 1, 2200, 1800, 1901, null, 11200, "ag_mrodriguez", "2026-08-11", 20, true,
    "A restored frame house one block from the Greenpoint waterfront, configured as an owner's duplex over a garden rental.", ["Two-Family", "Restored", "Garden", "Near Ferry", "Roof Rights"]],
  ["ls_21", "RLS-2267901", "24-20 41st Avenue", "12E", "Queens", "11101", "Long Island City", 1_075_000, 1_075_000, "under_contract", "Condo", 2, 2, 0, 1140, null, 2026, 940, 1180, "ag_dpark", "2026-07-19", 24, false,
    "Vernon Yards Residence 12E — a corner two-bedroom with floor-to-ceiling glass and river views, delivering Q1 2027.", ["New Development", "River Views", "Floor-to-Ceiling Glass", "Amenity Floor", "Tax Abatement"]],
  ["ls_22", "OK-8858812", "31 Bayberry Road", "", "Roslyn", "11576", "Roslyn Harbor", 3_495_000, 3_495_000, "active", "Single Family", 6, 5, 2, 6200, 43560, 2011, null, 58400, "ag_lbianchi", "2026-08-05", 22, true,
    "A gated acre in Roslyn Harbor with a stone-clad colonial, indoor sport court and a separate guest cottage.", ["Gated Acre", "Guest Cottage", "Sport Court", "Wine Cellar", "Roslyn Schools"]],
  ["ls_23", "RLS-2268330", "150 Rivington Street", "7C", "New York", "10002", "Lower East Side", 2_150_000, 2_150_000, "sold", "Condo", 2, 2, 0, 1230, null, 2019, 1480, 8900, "ag_schen", "2025-12-28", 21, false,
    "A corner two-bedroom with a private balcony and open north and east exposures over the Lower East Side.", ["Balcony", "Corner Unit", "Doorman", "Gym", "Tax Abatement"]],
  ["ls_24", "OK-8859440", "88 Remsen Street", "", "Brooklyn", "11201", "Brooklyn Heights", 3_895_000, 3_895_000, "sold", "Townhouse", 5, 3, 1, 3800, 1900, 1856, null, 26800, "ag_jocallahan", "2025-12-02", 17, false,
    "An Italianate brownstone on a landmarked Heights block, with a parlor-floor double salon and a south-facing garden.", ["Landmarked", "Parlor Floor", "South Garden", "Original Plaster", "Promenade Nearby"]],
];

function openHouses(id: string, agent: string, status: ListingStatus, i: number): OpenHouse[] {
  if (status !== "active" && status !== "coming_soon") return [];
  return [
    { id: `${id}_oh1`, date: "2026-08-30", start: "12:00 PM", end: "1:30 PM", hostAgentId: agent, registrations: 8 + (i % 14), attended: null },
    { id: `${id}_oh2`, date: "2026-09-06", start: "1:00 PM", end: "2:30 PM", hostAgentId: agent, registrations: 3 + (i % 9), attended: null },
  ];
}

export const listings: Listing[] = rows.map((r, i) => {
  const dom = Math.max(0, Math.round((new Date("2026-08-26").getTime() - new Date(r[20]).getTime()) / 86_400_000));
  return {
    id: r[0], mlsId: r[1], address: r[2], unit: r[3] || undefined, city: r[4], state: "NY", zip: r[5],
    neighborhood: r[6], price: r[7], originalPrice: r[8], status: r[9], propertyType: r[10],
    beds: r[11], baths: r[12], halfBaths: r[13], sqft: r[14], lotSqft: r[15], yearBuilt: r[16],
    hoa: r[17], taxes: r[18], listingAgentId: r[19], coListingAgentId: null, listedOn: r[20],
    daysOnMarket: dom,
    images: [`/listings/l${r[21]}-1.svg`, `/listings/l${r[21]}-2.svg`, `/listings/l${r[21]}-3.svg`],
    description: r[23], features: r[24], featured: r[22],
    views: 380 + ((i * 137) % 4200), saves: 12 + ((i * 29) % 180),
    showings: 4 + ((i * 13) % 38), offers: r[9] === "under_contract" || r[9] === "pending" ? 1 + (i % 3) : i % 3,
    openHouses: openHouses(r[0], r[19], r[9], i),
  };
});

export const listingById = (id: string) => listings.find((l) => l.id === id);
export const activeListings = listings.filter((l) => ["active", "coming_soon"].includes(l.status));
export const featuredListings = listings.filter((l) => l.featured);
export const listingsByAgent = (agentId: string) => listings.filter((l) => l.listingAgentId === agentId);

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  coming_soon: "Coming Soon", active: "Active", under_contract: "Under Contract",
  pending: "Pending", sold: "Sold", withdrawn: "Withdrawn", expired: "Expired",
};
