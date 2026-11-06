import test from "node:test";
import assert from "node:assert/strict";
import { buildQuote, QuoteError } from "../lib/quote.js";
import { availability } from "../lib/availability.js";

const fakeZip = async (url) => ({
  ok: url.endsWith("/08033"),
  json: async () => ({ places: [{ "place name": "Haddonfield", "state abbreviation": "NJ", latitude: "39.8915", longitude: "-75.0376" }] }),
});

test("ceramic prices vary by vehicle and take a 10% booking charge", async () => {
  const q = await buildQuote({ service: "ceramic-5", vehicle: "suv", addons: "interior-ceramic,full-interior" });
  assert.equal(q.lines[0].amount, 1700);
  assert.equal(q.startingTotal, 1700 + 200 + 225);
  assert.equal(q.bookingCharge.amount, Math.round(2125 * 0.1));
});

test("flat-priced services keep the $100 booking charge and drop add-ons that don't apply", async () => {
  const q = await buildQuote({ service: "interior", vehicle: "truck", addons: "pet-hair,polish" });
  assert.equal(q.startingTotal, 275 + 100);
  assert.deepEqual(q.skippedAddons, ["polish"]);
  assert.equal(q.bookingCharge.amount, 100);
});

test("mobile service looks the ZIP up and adds the fee floor", async () => {
  const q = await buildQuote({ service: "bronze", mobile: "true", zip: "08033" }, fakeZip);
  assert.equal(q.mobile.place, "Haddonfield, NJ");
  assert.ok(q.mobile.distanceMiles > 5 && q.mobile.distanceMiles < 20);
  assert.equal(q.startingTotal, 375 + 100);
});

test("unknown ZIP still quotes, with a note", async () => {
  const q = await buildQuote({ service: "bronze", mobile: "true", zip: "99999" }, fakeZip);
  assert.equal(q.mobile.distanceMiles, null);
});

test("fleet multiplies by vehicle count", async () => {
  const q = await buildQuote({ service: "fleet-weekly", vehicles: "6" });
  assert.equal(q.startingTotal, 600);
});

test("bad input is a QuoteError", async () => {
  await assert.rejects(buildQuote({ service: "nope" }), QuoteError);
  await assert.rejects(buildQuote({ service: "interior", vehicle: "boat" }), QuoteError);
});

test("availability is deterministic, skips Sundays and starts tomorrow", () => {
  const now = new Date("2026-11-07T10:00:00Z"); // Saturday
  const a = availability({ service: "interior", days: "7" }, now);
  const b = availability({ service: "interior", days: "7" }, now);
  assert.deepEqual(a, b);
  assert.equal(a.days[0].date, "2026-11-09"); // Sunday 8th skipped
  assert.ok(a.days.every((d) => d.weekday !== "Sun"));
  const long = availability({ service: "ceramic-8", days: "14" }, now);
  assert.ok(long.days.flatMap((d) => d.slots).every((s) => s.type === "drop-off" && s.days === 2));
});
