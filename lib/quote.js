import { SHOP, VEHICLES, ADDONS, POLICIES, findService, priceFor, addonPrice } from "./catalog.js";

const R_MILES = 3958.8;
function haversineMiles(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.sqrt(h));
}

// Looks a US ZIP up on the free Zippopotam.us API (no key). Returns null when unknown or slow.
export async function lookupZip(zip, fetchImpl = fetch) {
  if (!/^\d{5}$/.test(zip || "")) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetchImpl(`https://api.zippopotam.us/us/${zip}`, { signal: ctrl.signal });
    if (!r.ok) return null;
    const j = await r.json();
    const p = j.places?.[0];
    if (!p) return null;
    return { zip, place: `${p["place name"]}, ${p["state abbreviation"]}`, lat: Number(p.latitude), lon: Number(p.longitude) };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export class QuoteError extends Error {}

export async function buildQuote(params, fetchImpl = fetch) {
  const service = findService(params.service);
  if (!service) throw new QuoteError(`Unknown service "${params.service}". GET /api/services for the list.`);
  const vehicle = (params.vehicle || "car").toLowerCase();
  if (!VEHICLES.includes(vehicle)) throw new QuoteError(`vehicle must be one of ${VEHICLES.join(", ")}`);
  const qty = service.goal === "fleet" ? Math.min(Math.max(parseInt(params.vehicles || "1", 10) || 1, 1), 200) : 1;

  const lines = [{ id: service.id, label: service.name + (qty > 1 ? ` × ${qty}` : ""), amount: priceFor(service, vehicle) * qty }];
  const skipped = [];
  for (const id of (params.addons || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const a = ADDONS.find((x) => x.id === id);
    if (!a || (a.only && !a.only.includes(service.id))) { skipped.push(id); continue; }
    lines.push({ id: a.id, label: a.name, amount: addonPrice(a, service.id) });
  }

  let mobile = null;
  if (params.mobile === "true" || params.mobile === "1") {
    const where = await lookupZip(params.zip, fetchImpl);
    const miles = where ? Math.round(haversineMiles(SHOP.location, where)) : null;
    mobile = {
      zip: params.zip || null,
      place: where?.place ?? null,
      distanceMiles: miles,
      feeFrom: POLICIES.mobileFeeFrom,
      note: where
        ? `About ${miles} miles from the Pitman shop. Mobile fee starts at $${POLICIES.mobileFeeFrom}; the shop confirms it by distance.`
        : `ZIP not recognised. Mobile fee starts at $${POLICIES.mobileFeeFrom}; the shop confirms it by distance.`,
    };
    lines.push({ id: "mobile", label: "Mobile service (from)", amount: POLICIES.mobileFeeFrom });
  }

  const startingTotal = lines.reduce((s, l) => s + l.amount, 0);
  const bookingCharge = service.depositPercent ? Math.round((startingTotal * service.depositPercent) / 100) : POLICIES.bookingCharge;

  return {
    shop: SHOP.name,
    service: { id: service.id, name: service.name, summary: service.summary, estimatedHours: service.hours },
    vehicle,
    lines,
    skippedAddons: skipped,
    mobile,
    startingTotal,
    currency: "USD",
    bookingCharge: {
      amount: bookingCharge,
      rule: service.depositPercent ? `${service.depositPercent}% of the total, non-refundable` : "$100, non-refundable, paid when booking",
    },
    disclaimers: [
      "Starting prices for a vehicle in fair condition; the final price is confirmed at inspection.",
      `Excessive pet hair, sand or dirt adds a fee from $${POLICIES.conditionFeeFrom}.`,
      `Late arrival: $${POLICIES.lateFeePer30Min} per 30 minutes. No-show: $${POLICIES.noShowFee}.`,
    ],
    bookingUrl: SHOP.bookingUrl,
  };
}
