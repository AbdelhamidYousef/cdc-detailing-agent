import { buildQuote, QuoteError } from "../lib/quote.js";
import { send, query, preflight } from "../lib/http.js";

// GET /api/quote?service=ceramic-5&vehicle=suv&addons=pet-hair,engine-bay&mobile=true&zip=08080
export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    send(res, 200, await buildQuote(query(req)));
  } catch (e) {
    const known = e instanceof QuoteError;
    send(res, known ? 400 : 500, { error: known ? e.message : "Quote failed" });
  }
}
