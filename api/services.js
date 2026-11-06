import { SHOP, SERVICES, ADDONS, POLICIES, VEHICLES } from "../lib/catalog.js";
import { send, preflight } from "../lib/http.js";

// GET /api/services — the catalog the agent and the quote card read.
export default function handler(req, res) {
  if (preflight(req, res)) return;
  send(res, 200, { shop: SHOP, vehicles: VEHICLES, services: SERVICES, addons: ADDONS, policies: POLICIES });
}
