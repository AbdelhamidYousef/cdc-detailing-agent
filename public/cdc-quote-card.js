/* <cdc-quote-card> — a self-contained quote and booking card for the CDC Detailing agent.
 *
 * Attributes (all optional, so the agent can pre-fill what it already learned in chat):
 *   api      Base URL of the quote API (default: same origin)
 *   goal     clean | protect | tint | fleet
 *   vehicle  car | truck | suv
 *   service  a service id from /api/services
 *   zip      5-digit US ZIP (switches to mobile service)
 *
 * Events: "cdc-quote" (detail = the selection + the latest quote) whenever the quote changes,
 *         "cdc-book"  (detail = selection + chosen slot) when the customer taps Book.
 *
 * No framework, no build step: Shadow DOM keeps the styles from leaking into the host chat.
 */
(() => {
  if (customElements.get("cdc-quote-card")) return;

  const GOALS = [
    { id: "clean", label: "Clean it", hint: "Interior / exterior" },
    { id: "protect", label: "Protect paint", hint: "Polish & ceramic" },
    { id: "tint", label: "Tint windows", hint: "Film & ceramic" },
    { id: "fleet", label: "Fleet", hint: "Business vehicles" },
  ];
  const VEHICLES = [
    { id: "car", label: "Car" },
    { id: "truck", label: "Truck" },
    { id: "suv", label: "SUV" },
  ];
  const money = (n) => "$" + Number(n).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const CSS = `
  :host { --ink:#14181f; --muted:#5b6472; --line:#e3e6eb; --bg:#fff; --soft:#f5f7fa; --brand:#0b5fff; --brand-ink:#fff;
          --ok:#127a3e; --radius:14px; display:block; font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
          color:var(--ink); max-width:440px; container-type:inline-size; }
  @media (prefers-color-scheme: dark) {
    :host { --ink:#eef1f5; --muted:#a3acb9; --line:#2b313b; --bg:#151a21; --soft:#1d232c; --brand:#5b8cff; }
  }
  * { box-sizing:border-box; }
  .card { background:var(--bg); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; }
  header { padding:16px 16px 8px; }
  .seg .tile { white-space:nowrap; }
  h2 { font-size:17px; margin:0; }
  .sub { color:var(--muted); font-size:13px; margin:2px 0 0; }
  fieldset { border:0; margin:0; padding:12px 16px 4px; min-width:0; }
  legend { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); padding:0; margin-bottom:8px; }
  .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
  @container (min-width:400px) { .grid.g4 { grid-template-columns:repeat(4,1fr); } }
  .seg { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; background:var(--soft); padding:4px; border-radius:12px; }
  label.opt { position:relative; display:block; cursor:pointer; }
  label.opt input { position:absolute; opacity:0; inset:0; margin:0; cursor:pointer; }
  .tile { display:block; min-height:44px; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--bg);
          transition:border-color .15s, box-shadow .15s, background .15s; }
  .seg .tile { border-color:transparent; background:transparent; text-align:center; padding:10px 6px; font-weight:500; }
  .tile b { display:block; font-weight:600; }
  .tile small { color:var(--muted); font-size:12px; }
  input:checked + .tile { border-color:var(--brand); box-shadow:0 0 0 1px var(--brand) inset; background:color-mix(in srgb,var(--brand) 7%,var(--bg)); }
  .seg input:checked + .tile { background:var(--bg); box-shadow:0 1px 3px rgba(0,0,0,.12); }
  input:focus-visible + .tile { outline:2px solid var(--brand); outline-offset:2px; }
  .svc { display:grid; gap:8px; }
  .svc .tile { display:flex; gap:10px; align-items:flex-start; justify-content:space-between; }
  .svc .price { white-space:nowrap; font-weight:600; }
  .price small { display:block; text-align:right; font-weight:400; }
  .addons { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:6px 12px; border:1px solid var(--line);
          border-radius:999px; font-size:13px; cursor:pointer; user-select:none; background:var(--bg); }
  .chip input { accent-color:var(--brand); margin:0; }
  .chip:has(input:checked) { border-color:var(--brand); background:color-mix(in srgb,var(--brand) 7%,var(--bg)); }
  .where { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .where .seg { grid-template-columns:repeat(2,1fr); flex:1 1 200px; }
  .zip { flex:0 0 120px; height:44px; border:1px solid var(--line); border-radius:12px; padding:0 12px; font:inherit; color:var(--ink); background:var(--bg); }
  .zip[hidden] { display:none; }
  .note { color:var(--muted); font-size:12px; margin:6px 0 0; }
  .quote { margin:12px 16px 0; padding:12px; background:var(--soft); border-radius:12px; }
  .row { display:flex; justify-content:space-between; gap:12px; font-size:14px; padding:2px 0; }
  .row.total { font-weight:700; font-size:16px; border-top:1px solid var(--line); margin-top:6px; padding-top:8px; }
  .skeleton { height:14px; border-radius:6px; background:linear-gradient(90deg,var(--line),var(--soft),var(--line)); background-size:200% 100%;
              animation:sh 1.2s infinite; margin:6px 0; }
  @keyframes sh { to { background-position:-200% 0; } }
  .slots { display:flex; gap:8px; overflow-x:auto; scroll-snap-type:x mandatory; padding:2px 16px 4px; margin:0 -16px;
           scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .slots::-webkit-scrollbar { display:none; }
  .slot { scroll-snap-align:start; flex:0 0 auto; }
  .slot .tile { min-width:92px; text-align:center; padding:8px 10px; }
  .empty { color:var(--muted); font-size:13px; }
  footer { position:sticky; bottom:0; display:flex; gap:8px; align-items:center; padding:12px 16px 16px; margin-top:12px;
           background:var(--bg); border-top:1px solid var(--line); }
  .sum { flex:1; min-width:0; }
  .sum b { display:block; font-size:18px; }
  .sum small { color:var(--muted); font-size:12px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .btn { min-height:48px; padding:0 18px; border-radius:12px; border:0; font:600 15px/1 inherit; font-family:inherit; cursor:pointer;
         background:var(--brand); color:var(--brand-ink); text-decoration:none; display:inline-flex; align-items:center; }
  .btn[aria-disabled=true] { opacity:.5; pointer-events:none; }
  .btn.ghost { background:transparent; color:var(--brand); border:1px solid var(--line); padding:0 14px; }
  .err { color:#b42318; font-size:13px; }
  @media (prefers-reduced-motion: reduce) { * { transition:none !important; animation:none !important; } }
  `;

  class CdcQuoteCard extends HTMLElement {
    static get observedAttributes() { return ["goal", "vehicle", "service", "zip", "api"]; }

    constructor() {
      super();
      this.root = this.attachShadow({ mode: "open" });
      this.state = { goal: "clean", vehicle: "car", service: null, addons: new Set(), mobile: false, zip: "", vehicles: 1, slot: null };
      this.catalog = null;
      this.quote = null;
      this.timer = null;
      this.reqId = 0;
    }

    get api() { return (this.getAttribute("api") || "").replace(/\/$/, ""); }

    async connectedCallback() {
      this.readAttrs();
      this.root.innerHTML = `<style>${CSS}</style><div class="card"><header><h2>Build your detail</h2><p class="sub">Loading services…</p></header></div>`;
      try {
        const r = await fetch(this.api + "/api/services");
        if (!r.ok) throw new Error(r.status);
        this.catalog = await r.json();
      } catch {
        this.root.querySelector(".sub").innerHTML = `Couldn't load services. Call <a href="tel:+18569798460">856-979-8460</a>.`;
        return;
      }
      this.render();
      this.refresh();
    }

    attributeChangedCallback() {
      if (!this.catalog) return;
      this.readAttrs();
      this.render();
      this.refresh();
    }

    readAttrs() {
      const s = this.state;
      const g = this.getAttribute("goal"), v = this.getAttribute("vehicle"), svc = this.getAttribute("service"), zip = this.getAttribute("zip");
      if (GOALS.some((x) => x.id === g)) s.goal = g;
      if (VEHICLES.some((x) => x.id === v)) s.vehicle = v;
      if (svc) s.service = svc;
      if (/^\d{5}$/.test(zip || "")) { s.zip = zip; s.mobile = true; }
    }

    services() { return this.catalog.services.filter((x) => x.goal === this.state.goal); }

    priceOf(svc) {
      return typeof svc.price === "number" ? svc.price : svc.price[this.state.vehicle];
    }

    render() {
      const s = this.state, c = this.catalog;
      const list = this.services();
      if (!list.some((x) => x.id === s.service)) {
        const fromAttr = c.services.find((x) => x.id === s.service);
        if (fromAttr) s.goal = fromAttr.goal;
        else s.service = list[0].id;
      }
      const svcs = this.services();
      const addons = c.addons.filter((a) => !a.only || a.only.includes(s.service));
      for (const id of [...s.addons]) if (!addons.some((a) => a.id === id)) s.addons.delete(id);
      const addonPrice = (a) => (typeof a.price === "number" ? a.price : a.price[s.service]);

      this.root.innerHTML = `<style>${CSS}</style>
      <form class="card" novalidate>
        <header><h2>Build your detail</h2><p class="sub">${esc(c.shop.name)} · Pitman, NJ · starting prices</p></header>

        <fieldset><legend>What do you need?</legend>
          <div class="grid g4" role="radiogroup">
            ${GOALS.map((g) => `<label class="opt"><input type="radio" name="goal" value="${g.id}" ${g.id === s.goal ? "checked" : ""}>
              <span class="tile"><b>${g.label}</b><small>${g.hint}</small></span></label>`).join("")}
          </div>
        </fieldset>

        ${s.goal === "fleet" ? `
        <fieldset><legend>How many vehicles?</legend>
          <input class="zip" type="number" inputmode="numeric" min="1" max="200" name="vehicles" value="${s.vehicles}" aria-label="Number of vehicles">
        </fieldset>` : `
        <fieldset><legend>Vehicle</legend>
          <div class="seg" role="radiogroup">
            ${VEHICLES.map((v) => `<label class="opt"><input type="radio" name="vehicle" value="${v.id}" ${v.id === s.vehicle ? "checked" : ""}>
              <span class="tile">${v.label}</span></label>`).join("")}
          </div>
        </fieldset>`}

        <fieldset><legend>Service</legend>
          <div class="svc" role="radiogroup">
            ${svcs.map((x) => `<label class="opt"><input type="radio" name="service" value="${x.id}" ${x.id === s.service ? "checked" : ""}>
              <span class="tile"><span><b>${esc(x.name)}</b><small>${esc(x.summary)}</small></span>
              <span class="price">${money(this.priceOf(x))}<small>${x.unit ? esc(x.unit) : "from"}</small></span></span></label>`).join("")}
          </div>
        </fieldset>

        ${addons.length ? `<fieldset><legend>Add-ons</legend><div class="addons">
          ${addons.map((a) => `<label class="chip"><input type="checkbox" name="addon" value="${a.id}" ${s.addons.has(a.id) ? "checked" : ""}>
            ${esc(a.name)} · ${money(addonPrice(a))}</label>`).join("")}
        </div></fieldset>` : ""}

        <fieldset><legend>Where</legend>
          <div class="where">
            <div class="seg" role="radiogroup">
              <label class="opt"><input type="radio" name="where" value="shop" ${!s.mobile ? "checked" : ""}><span class="tile">At the shop</span></label>
              <label class="opt"><input type="radio" name="where" value="mobile" ${s.mobile ? "checked" : ""}><span class="tile">Come to me</span></label>
            </div>
            <input class="zip" name="zip" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="ZIP"
              aria-label="ZIP code" value="${esc(s.zip)}" ${s.mobile ? "" : "hidden"}>
          </div>
          <p class="note" data-mobile-note>${s.mobile ? "Mobile fee from $100, set by distance." : "420 Andbro Dr Unit 7, Pitman, NJ"}</p>
        </fieldset>

        <div class="quote" aria-live="polite" data-quote><div class="skeleton"></div><div class="skeleton"></div></div>

        <fieldset><legend>Next open times</legend>
          <div class="slots" data-slots><span class="empty">Loading…</span></div>
          <p class="note" data-slot-note></p>
        </fieldset>

        <footer>
          <div class="sum"><b data-total>—</b><small data-deposit>Starting total</small></div>
          <a class="btn ghost" href="tel:+18569798460" aria-label="Call the shop">Call</a>
          <a class="btn" data-book href="${esc(c.shop.bookingUrl)}" target="_blank" rel="noopener">Book</a>
        </footer>
      </form>`;

      const form = this.root.querySelector("form");
      form.addEventListener("submit", (e) => e.preventDefault());
      form.addEventListener("change", (e) => this.onChange(e));
      form.addEventListener("input", (e) => { if (e.target.name === "zip" || e.target.name === "vehicles") this.onChange(e); });
      this.root.querySelector("[data-book]").addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("cdc-book", { bubbles: true, composed: true, detail: this.detail() }));
      });
    }

    onChange(e) {
      const s = this.state, t = e.target;
      if (t.name === "goal") { s.goal = t.value; s.service = null; s.slot = null; this.render(); }
      else if (t.name === "vehicle") { s.vehicle = t.value; this.render(); }
      else if (t.name === "service") { s.service = t.value; s.slot = null; this.render(); }
      else if (t.name === "addon") { t.checked ? s.addons.add(t.value) : s.addons.delete(t.value); }
      else if (t.name === "where") { s.mobile = t.value === "mobile"; this.render(); }
      else if (t.name === "zip") { s.zip = t.value.replace(/\D/g, "").slice(0, 5); if (s.zip.length && s.zip.length < 5) return; }
      else if (t.name === "vehicles") { s.vehicles = Math.max(1, Math.min(200, parseInt(t.value, 10) || 1)); }
      else if (t.name === "slot") { s.slot = t.value; this.updateFooter(); this.emit(); return; }
      this.refresh();
    }

    refresh() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.loadQuote(); this.loadSlots(); }, 250);
    }

    async loadQuote() {
      const s = this.state, id = ++this.reqId;
      const q = new URLSearchParams({ service: s.service, vehicle: s.vehicle });
      if (s.addons.size) q.set("addons", [...s.addons].join(","));
      if (s.mobile) { q.set("mobile", "true"); if (s.zip) q.set("zip", s.zip); }
      if (s.goal === "fleet") q.set("vehicles", s.vehicles);
      const box = this.root.querySelector("[data-quote]");
      try {
        const r = await fetch(`${this.api}/api/quote?${q}`);
        const j = await r.json();
        if (id !== this.reqId) return; // a newer request won
        if (!r.ok) throw new Error(j.error);
        this.quote = j;
        box.innerHTML = j.lines.map((l) => `<div class="row"><span>${esc(l.label)}</span><span>${money(l.amount)}</span></div>`).join("") +
          `<div class="row total"><span>Starting total</span><span>${money(j.startingTotal)}</span></div>` +
          `<p class="note">${esc(j.disclaimers[0])}</p>`;
        const mn = this.root.querySelector("[data-mobile-note]");
        if (j.mobile && mn) mn.textContent = j.mobile.place ? `${j.mobile.place}: ${j.mobile.note}` : j.mobile.note;
        this.updateFooter();
        this.emit();
      } catch (err) {
        if (id !== this.reqId) return;
        box.innerHTML = `<p class="err">Couldn't price this right now. Call 856-979-8460 for a free quote.</p>`;
      }
    }

    async loadSlots() {
      const s = this.state, wrap = this.root.querySelector("[data-slots]");
      try {
        const r = await fetch(`${this.api}/api/availability?service=${encodeURIComponent(s.service)}&days=10`);
        const j = await r.json();
        const flat = j.days.flatMap((d) => d.slots.map((x) => ({ ...x, date: d.date, weekday: d.weekday }))).slice(0, 12);
        wrap.innerHTML = flat.length ? flat.map((x) => {
          const v = `${x.date}T${x.start}`;
          const day = new Date(x.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
          return `<label class="opt slot"><input type="radio" name="slot" value="${v}" ${s.slot === v ? "checked" : ""}>
            <span class="tile"><b>${x.weekday} ${day}</b><small>${x.type === "drop-off" ? `Drop-off ${x.start}${x.days > 1 ? ` · ${x.days} days` : ""}` : x.start}</small></span></label>`;
        }).join("") : `<span class="empty">No open times in the next 10 days. Call the shop.</span>`;
        this.root.querySelector("[data-slot-note]").textContent = j.note;
      } catch {
        wrap.innerHTML = `<span class="empty">Times unavailable. Book on Square to see the live calendar.</span>`;
      }
    }

    updateFooter() {
      if (!this.quote) return;
      this.root.querySelector("[data-total]").textContent = money(this.quote.startingTotal);
      const slot = this.state.slot ? ` · ${this.state.slot.replace("T", " ")}` : "";
      this.root.querySelector("[data-deposit]").textContent = `${money(this.quote.bookingCharge.amount)} to book${slot}`;
    }

    detail() {
      const s = this.state;
      return { goal: s.goal, vehicle: s.vehicle, service: s.service, addons: [...s.addons], mobile: s.mobile, zip: s.zip,
        vehicles: s.vehicles, slot: s.slot, quote: this.quote };
    }

    emit() { this.dispatchEvent(new CustomEvent("cdc-quote", { bubbles: true, composed: true, detail: this.detail() })); }
  }

  customElements.define("cdc-quote-card", CdcQuoteCard);
})();
