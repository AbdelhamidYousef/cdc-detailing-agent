// Service catalog for CDC Detailing LLC (Pitman, NJ).
// Every price is a "starting at" figure copied from the public website
// (https://cdcautodetailing.com — detail-packages, ceramic-coating, interior-details,
// exterior-details, window-tinting pages, read 2026-11-07). The shop confirms the final
// price at inspection. Per-vehicle prices exist on the site only for ceramic packages,
// so only those vary by vehicle here.

export const SHOP = {
  name: "CDC Detailing LLC",
  address: "420 Andbro Dr Unit 7, Pitman, NJ 08071",
  phone: "+1 856-979-8460",
  email: "cdcdetailingllc@gmail.com",
  website: "https://cdcautodetailing.com",
  bookingUrl:
    "https://book.squareup.com/appointments/1n4da69plzpobz/location/LAY37RFSTBZX3/services",
  location: { lat: 39.7326, lon: -75.1316 }, // Pitman, NJ
};

export const VEHICLES = ["car", "truck", "suv"]; // car = car / sedan / coupe

export const SERVICES = [
  // Goal: clean
  { id: "mini-interior", goal: "clean", name: "Mini Express Interior", price: 100, hours: 1.5,
    summary: "Quick vacuum and wipe-down, mats power washed, glass cleaned." },
  { id: "mini-exterior", goal: "clean", name: "Mini Express Exterior", price: 150, hours: 1.5,
    summary: "Foam wash and dry, wheels and tires, glass, tire shine." },
  { id: "exterior", goal: "clean", name: "Exterior Detail", price: 175, hours: 2.5,
    summary: "Multi-step hand wash, decontamination, wheels, trim and tire dressing." },
  { id: "interior", goal: "clean", name: "Interior Detail", price: 275, hours: 3,
    summary: "Full steam of seats, carpets and plastics; mats deep-cleaned." },
  { id: "bronze", goal: "clean", name: "Bronze Package", price: 375, hours: 4,
    summary: "Full interior steam + exterior foam wash, ceramic spray wax (3–4 weeks of protection)." },
  // Goal: protect / correct paint
  { id: "silver", goal: "protect", name: "Silver Package", price: 600, hours: 6,
    summary: "Clay bar, 1-step machine polish, 6–12 month paint sealant, 1-year wheel coating." },
  { id: "ceramic-3", goal: "protect", name: "Silver+ · 3-Year Ceramic Coating",
    price: { car: 1000, truck: 1100, suv: 1200 }, hours: 8, depositPercent: 10,
    summary: "1-step paint correction + 3-year ceramic on paint and wheel faces." },
  { id: "ceramic-5", goal: "protect", name: "Gold · 5-Year Ceramic Coating",
    price: { car: 1500, truck: 1600, suv: 1700 }, hours: 12, depositPercent: 10,
    summary: "Multi-step paint correction (90–95% of swirls) + 5-year ceramic; 3-year wheels, 1-year glass." },
  { id: "ceramic-8", goal: "protect", name: "Gold · 8-Year Ceramic Coating",
    price: { car: 2200, truck: 2300, suv: 2400 }, hours: 14, depositPercent: 10,
    summary: "Gold package with an 8-year rated ceramic coating." },
  // Goal: tint
  { id: "tint-standard", goal: "tint", name: "Window Tint · Standard Film", price: 350, hours: 2.5,
    summary: "All side windows and the back window." },
  { id: "tint-ceramic", goal: "tint", name: "Window Tint · Nano Ceramic (GeoShield)", price: 500, hours: 3,
    summary: "All side windows and the back window, nano ceramic film for heat rejection." },
  // Goal: fleet (per vehicle, per visit)
  { id: "fleet-weekly", goal: "fleet", name: "Fleet Exterior · Weekly", price: 100, hours: 1, unit: "per vehicle",
    summary: "Quick wheel and tire clean, exterior wash, glass, tire shine." },
  { id: "fleet-biweekly", goal: "fleet", name: "Fleet Exterior · Bi-weekly", price: 170, hours: 1, unit: "per vehicle",
    summary: "Same maintenance wash, every two weeks." },
  { id: "fleet-monthly", goal: "fleet", name: "Fleet Exterior · Monthly", price: 200, hours: 1, unit: "per vehicle",
    summary: "Same maintenance wash, once a month." },
];

export const ADDONS = [
  { id: "pet-hair", name: "Pet hair removal", price: 100, note: "Never included in packages" },
  { id: "headliner", name: "Headliner cleaning", price: 100, note: "Never included in packages" },
  { id: "seat-shampoo", name: "Seat shampoo", price: 100 },
  { id: "carpet-shampoo", name: "Carpet shampoo", price: 100 },
  { id: "odor", name: "Odor removal", price: 100 },
  { id: "engine-bay", name: "Engine bay detail", price: 100 },
  { id: "undercarriage", name: "Undercarriage", price: 100 },
  { id: "headlights", name: "Headlight restoration", price: 100 },
  { id: "windshield-coating", name: "Windshield coating", price: 75 },
  { id: "polish", name: "All-in-1 polish and wax (Bronze)", price: 150, only: ["bronze"] },
  { id: "full-interior", name: "Full interior detail upgrade", price: 225,
    only: ["silver", "ceramic-3", "ceramic-5", "ceramic-8"] },
  { id: "interior-ceramic", name: "Interior ceramic coating", price: 200,
    only: ["ceramic-3", "ceramic-5", "ceramic-8"], note: "Needs the full interior detail" },
  { id: "tint-windshield", name: "Front windshield tint", price: { "tint-standard": 225, "tint-ceramic": 325 },
    only: ["tint-standard", "tint-ceramic"] },
  { id: "tint-visor", name: "Visor strip", price: { "tint-standard": 50, "tint-ceramic": 75 },
    only: ["tint-standard", "tint-ceramic"] },
];

export const POLICIES = {
  bookingCharge: 100, // non-refundable, up front; 10% of total for Silver+ and Gold
  mobileFeeFrom: 100, // depends on distance from the Pitman shop
  conditionFeeFrom: 60, // excessive pet hair / dirt, agreed at inspection
  lateFeePer30Min: 25,
  noShowFee: 100,
};

export function findService(id) {
  return SERVICES.find((s) => s.id === id);
}

export function priceFor(service, vehicle) {
  return typeof service.price === "number" ? service.price : service.price[vehicle] ?? service.price.car;
}

export function addonPrice(addon, serviceId) {
  return typeof addon.price === "number" ? addon.price : addon.price[serviceId];
}
