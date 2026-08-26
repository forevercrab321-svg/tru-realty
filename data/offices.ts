import type { Office } from "@/types";

export const offices: Office[] = [
  {
    id: "of_flatiron", name: "Flatiron — Headquarters", code: "NY-FLT",
    street: "27 West 24th Street, 8th Floor", city: "New York", state: "NY", zip: "10010",
    phone: "2125550142", managingBroker: "Grace Whitfield", agentCount: 6,
    opened: "2019-04-01", timezone: "America/New_York",
  },
  {
    id: "of_williamsburg", name: "Williamsburg", code: "NY-WBG",
    street: "134 North 6th Street", city: "Brooklyn", state: "NY", zip: "11249",
    phone: "7185550188", managingBroker: "Andre Okafor", agentCount: 4,
    opened: "2021-09-15", timezone: "America/New_York",
  },
  {
    id: "of_lic", name: "Long Island City", code: "NY-LIC",
    street: "45-10 Court Square, Suite 300", city: "Queens", state: "NY", zip: "11101",
    phone: "7185550119", managingBroker: "Marisol Reyes", agentCount: 3,
    opened: "2023-02-06", timezone: "America/New_York",
  },
  {
    id: "of_gardencity", name: "Garden City", code: "NY-GDC",
    street: "1225 Franklin Avenue, Suite 205", city: "Garden City", state: "NY", zip: "11530",
    phone: "5165550164", managingBroker: "Peter Lombardi", agentCount: 3,
    opened: "2024-06-03", timezone: "America/New_York",
  },
];

export const officeById = (id: string) => offices.find((o) => o.id === id);
export const officeName = (id: string) => officeById(id)?.name.replace(" — Headquarters", "") ?? "—";

export const company = {
  legalName: "Tru Realty Group LLC",
  dba: "Tru Realty",
  license: "10991234567",
  ein: "88-3921047",
  founded: 2019,
  hq: "27 West 24th Street, 8th Floor, New York, NY 10010",
  phone: "2125550100",
  email: "hello@trurealty.com",
  principalBroker: "Grace Whitfield",
  states: ["New York", "New Jersey", "Connecticut"],
  mlsBoards: ["REBNY RLS", "OneKey MLS", "Hudson Gateway"],
  tagline: "Real Estate. Built Around You.",
};
