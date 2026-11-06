import { findService } from "./catalog.js";

// DEMO SCHEDULE. The shop's real calendar lives in Square Appointments, which needs the
// owner's OAuth token to read. Until then this returns a deterministic, believable
// schedule: Mon–Sat 8:00–17:00 (assumed hours) with some slots taken, seeded by date so
// the same date always answers the same way.
const OPEN = 8, CLOSE = 17;

function seeded(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
}

const iso = (d) => d.toISOString().slice(0, 10);

export function availability({ service: id, from, days }, now = new Date()) {
  const service = findService(id);
  if (!service) return { error: `Unknown service "${id}". GET /api/services for the list.` };
  const span = Math.min(Math.max(parseInt(days || "7", 10) || 7, 1), 21);
  // "Tomorrow" in the shop's time zone (UTC-5; DST ignored for a demo).
  const ny = new Date(now.getTime() - 5 * 3600000);
  const tomorrow = new Date(Date.UTC(ny.getUTCFullYear(), ny.getUTCMonth(), ny.getUTCDate() + 1, 12));
  let start = /^\d{4}-\d{2}-\d{2}$/.test(from || "") ? new Date(from + "T12:00:00Z") : tomorrow;
  if (isNaN(start) || start < tomorrow) start = tomorrow;

  const workday = CLOSE - OPEN;
  const out = [];
  for (let i = 0; i < span; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d.getUTCDay() === 0) continue; // closed Sunday (assumed)
    const rnd = seeded(iso(d) + service.id);
    const slots = [];
    if (service.hours > 6) {
      // Long jobs: morning drop-off only, may span several days.
      if (rnd() < 0.55) slots.push({ start: "08:00", type: "drop-off", days: Math.ceil(service.hours / workday) });
    } else {
      for (let h = OPEN; h + service.hours <= CLOSE; h++) {
        if (rnd() > 0.45) slots.push({ start: `${String(h).padStart(2, "0")}:00`, type: "appointment" });
      }
    }
    out.push({ date: iso(d), weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), slots });
  }
  return {
    service: { id: service.id, name: service.name, estimatedHours: service.hours },
    timezone: "America/New_York",
    source: "demo-schedule",
    note: "Demo availability, not the shop's live calendar. The booking is confirmed on Square.",
    days: out,
  };
}
