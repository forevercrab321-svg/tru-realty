import { listings } from "./listings";
import { agents } from "./agents";

/**
 * Editorial neighborhood guides for the marketing site.
 *
 * Counts and price points are derived from live inventory rather than written down, so a
 * guide can never claim inventory the site doesn't actually have.
 */
export type Neighborhood = {
  slug: string;
  name: string;
  borough: string;
  image: string;
  blurb: string;
  character: string[];
};

const GUIDES: Neighborhood[] = [
  {
    slug: "flatiron-gramercy", name: "Flatiron & Gramercy", borough: "Manhattan", image: "/listings/l1-1.svg",
    blurb: "Loft-scaled prewar buildings and full-service towers around two of the city's few private parks. Quiet at night, walkable to everything.",
    character: ["Prewar condos", "Park access", "Restaurant row"],
  },
  {
    slug: "west-village-tribeca", name: "West Village & Tribeca", borough: "Manhattan", image: "/listings/l13-1.svg",
    blurb: "Landmarked townhouse blocks and cast-iron lofts. The most protected streetscape in Manhattan, and priced accordingly.",
    character: ["Townhouses", "Cast-iron lofts", "Landmarked"],
  },
  {
    slug: "brownstone-brooklyn", name: "Brownstone Brooklyn", borough: "Brooklyn", image: "/listings/l4-1.svg",
    blurb: "Park Slope, Cobble Hill and Carroll Gardens — limestone and brownstone rows, deep gardens, and the best school districts in the borough.",
    character: ["Historic districts", "Gardens", "Family-scaled"],
  },
  {
    slug: "north-brooklyn", name: "Greenpoint & Williamsburg", borough: "Brooklyn", image: "/listings/l5-1.svg",
    blurb: "Waterfront condos alongside small frame houses and three-families. The strongest small multi-family market in the city.",
    character: ["Multi-family", "Waterfront", "Ferry access"],
  },
  {
    slug: "long-island-city", name: "Long Island City", borough: "Queens", image: "/listings/l7-1.svg",
    blurb: "New construction with tax abatements, skyline views across the river, and one subway stop to Midtown.",
    character: ["New development", "421-a abatements", "Skyline views"],
  },
  {
    slug: "north-shore", name: "Nassau North Shore", borough: "Long Island", image: "/listings/l22-1.svg",
    blurb: "Garden City, Manhasset, Roslyn and Great Neck — half-acre lots, top-decile schools, and a 35-minute train to Penn.",
    character: ["Single family", "School districts", "LIRR commute"],
  },
];

export const neighborhoods = GUIDES.map((n) => {
  const inventory = listings.filter(
    (l) => n.character && matches(n.slug, l.neighborhood, l.city) && !["sold", "withdrawn"].includes(l.status)
  );
  const specialists = agents.filter(
    (a) => a.status === "active" && a.neighborhoods.some((h) => matches(n.slug, h, h))
  );
  const prices = inventory.map((l) => l.price).sort((a, b) => a - b);
  return {
    ...n,
    listingCount: inventory.length,
    agentCount: specialists.length,
    priceFrom: prices[0] ?? 0,
    priceTo: prices[prices.length - 1] ?? 0,
  };
});

function matches(slug: string, hood: string, city: string) {
  const map: Record<string, string[]> = {
    "flatiron-gramercy": ["Flatiron", "Gramercy", "NoMad", "Chelsea", "Kips Bay", "Murray Hill", "Midtown East"],
    "west-village-tribeca": ["West Village", "Tribeca", "SoHo", "NoHo", "Lower East Side"],
    "brownstone-brooklyn": ["Park Slope", "Cobble Hill", "Carroll Gardens", "Brooklyn Heights", "Crown Heights", "Bed-Stuy", "Prospect Heights", "Fort Greene", "Clinton Hill"],
    "north-brooklyn": ["Greenpoint", "Williamsburg", "Bushwick", "East Williamsburg"],
    "long-island-city": ["Long Island City", "Hunters Point", "Astoria", "Sunnyside", "Forest Hills", "Rego Park", "Jackson Heights", "Ditmars", "Woodside"],
    "north-shore": ["Garden City", "Manhasset", "Roslyn", "Great Neck", "Rockville Centre", "Port Washington", "Old Westbury", "Roslyn Harbor"],
  };
  return (map[slug] ?? []).some((k) => hood.includes(k) || city.includes(k));
}
