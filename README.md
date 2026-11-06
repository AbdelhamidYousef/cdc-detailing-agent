# CDC Detailing agent: quote API + quote card

Unofficial demo built for an [Agentplace](https://agentplace.io) agent that helps customers of
**CDC Detailing LLC** (Pitman, NJ, [cdcautodetailing.com](https://cdcautodetailing.com)) choose a service,
get a starting-price estimate and go to the shop's Square booking page. Prices are the shop's published
"starting at" figures; availability is a demo schedule.

- `api/services.js`: `GET /api/services`, the catalog, add-ons and policies
- `api/quote.js`: `GET /api/quote?service=ceramic-5&vehicle=suv&addons=pet-hair&mobile=true&zip=08033`,
  an itemized estimate, booking charge and mobile distance (ZIP → miles via the free Zippopotam.us API)
- `api/availability.js`: `GET /api/availability?service=interior&days=7`, open slots (demo schedule)
- `public/cdc-quote-card.js`: `<cdc-quote-card>`, a framework-free web component (Shadow DOM) for the
  interface element the agent shows in the chat
- `test/`: `npm test` (Node's built-in test runner, no dependencies)

Run locally: `node dev-server.js` → http://127.0.0.1:8787. Deployed on Vercel (zero config).
