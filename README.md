# CDC Detailing agent: quote API + quote card

An [Agentplace](https://agentplace.io) agent for **CDC Detailing LLC**, a car detailing, ceramic coating and window
tint shop in Pitman, NJ ([cdcautodetailing.com](https://cdcautodetailing.com)). It helps a visitor choose a service,
collects what the shop needs (vehicle, condition, shop or mobile, date, contact), prices it and sends them to the
shop's Square booking page. Unofficial demo built from the public website.

- **Agent (public, Luna model):** https://d6bq12k90opm.run.agentplace.io/
- **API + card demo:** https://cdc-detailing-agent.vercel.app

## What's in the repo

| Path | What |
|---|---|
| `lib/catalog.js` | Services, add-ons and policies copied from the shop's site (starting prices; per-vehicle only where the site lists it) |
| `api/services.js` | `GET /api/services`: the catalog |
| `api/quote.js` + `lib/quote.js` | `GET /api/quote?service=ceramic-5&vehicle=suv&addons=pet-hair&mobile=true&zip=08033`: itemized estimate, booking charge (flat $100, or 10% for ceramic packages), mobile distance |
| `api/availability.js` + `lib/availability.js` | `GET /api/availability?service=interior&days=7`: open slots; long jobs become morning drop-offs |
| `public/cdc-quote-card.js` | `<cdc-quote-card>`, the interface element the agent shows in the chat |
| `test/api.test.js` | `npm test` (Node's built-in runner, no dependencies) |

Run locally: `node dev-server.js` → http://127.0.0.1:8787. Deploys to Vercel with zero config.

## How the pieces fit

```
visitor ⇄ Agentplace agent (Luna)
            ├─ tools: list_services / get_quote / get_availability ──► Vercel functions (this repo)
            │                                                              └─ get_quote ──► Zippopotam.us (ZIP → lat/lon → miles from Pitman)
            └─ UI component "QuoteCard" ── loads public/cdc-quote-card.js ──► same API from the browser
                                            └─ cdc-quote / cdc-book events ──► back into the conversation
handoff ──► Square Appointments booking page + shop phone
```

The agent never does arithmetic: every price it says comes from `get_quote`, so the chat and the card can't
disagree. Prices live in one file (`lib/catalog.js`), so a price change is one edit, not a prompt rewrite.

## The quote card (frontend notes)

**Why it helps:** a detailing quote has four inputs (goal, vehicle, service, add-ons) plus location. Typing that into a
chat is slow and error-prone; tapping it is fast, and the price updates as they tap. The agent pre-fills the card from
what the customer already said (`goal`, `vehicle`, `service`, `zip` attributes), so the card confirms rather than
re-asks.

**Choices:**
- Framework-free web component with Shadow DOM: it drops into any host (the Agentplace runtime, a Webflow or
  WordPress site, a plain page) and the host's CSS can't break it, nor can it leak styles into the chat.
- Every option is a real radio or checkbox inside a `<fieldset>` with a `<legend>`, so keyboard and screen readers
  work without ARIA tricks; visible focus ring; `aria-live` on the price box.
- Requests are debounced (250 ms) and stale responses are dropped (request id), so fast tapping never shows an old
  price. Loading uses a skeleton; failures fall back to the phone number.
- It emits `cdc-quote` (every price change) and `cdc-book` (Book tapped) with the full selection, which the agent uses
  as context.

**On a phone:**
- One column; tiles are at least 44 px tall; the goal grid goes 2×2 below 400 px of *container* width (container
  query, because the chat column is narrower than the screen).
- Open times are a horizontal scroll-snap row instead of a long list.
- The total, booking charge, Call and Book stay in a sticky footer, so the price is always visible while scrolling.
- Numeric keypad for ZIP (`inputmode="numeric"`, `autocomplete="postal-code"`); dark mode and reduced motion
  respected.

## Production changes I'd make

1. **Real availability and booking:** replace the demo schedule with Square's Bookings API
   (`SearchAvailability`, then `CreateBooking`) under the owner's OAuth token, stored server-side. The card would then
   book in place instead of handing off.
2. **Lead capture:** a `POST /api/requests` that writes the collected details to the shop's CRM or sends them by
   email/SMS, so a customer who doesn't book is still a lead.
3. **Mobile fee by distance:** the site only says "from $100"; with the owner's tiers, `get_quote` would return the
   exact fee and refuse ZIPs outside the service area.
4. Typed contract (TypeScript + zod) shared by the API and the card, rate limiting, request logging with a
   correlation id from the agent's tool call, and caching ZIP lookups.
5. Prices as data the owner can edit (a Google Sheet or Airtable read at build time) instead of a code change.

## Platform limits I hit

- **Card overlap on phones:** Agentplace's floating input bar covers the bottom of the card; a tap near the card's
  bottom edge lands on the bar's buttons. I'd want the runtime to reserve space (or expose a CSS variable for the bar
  height) so components can pad themselves.
- **Card → chat bridge:** card events arrive as an attached "selection to review", not as a message the agent reads
  immediately, so the agent only reacts once the customer sends something. A first-class "component action" event
  would close that loop.
- No endpoint for submitting a request, so details collected in chat stay in the chat (see *Lead capture* above).
- Builder credits are limited on the free plan; the build finished on the free Luna model.

## Data source

Service names, inclusions, prices and policies: the shop's public pages (detail packages, ceramic coating, interior,
exterior, window tinting), read 2026-11-07. Starting prices; the shop confirms the final price at inspection.
