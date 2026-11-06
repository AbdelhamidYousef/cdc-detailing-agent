import { availability } from "../lib/availability.js";
import { send, query, preflight } from "../lib/http.js";

// GET /api/availability?service=interior&from=2026-11-10&days=7
export default function handler(req, res) {
  if (preflight(req, res)) return;
  const out = availability(query(req));
  send(res, out.error ? 400 : 200, out);
}
