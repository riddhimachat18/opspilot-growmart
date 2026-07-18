# OpsPilot Redesign — Implementation Prompt

Use this as a direct brief for yourself or your coding assistant (Claude Code / Cursor). It covers three separate surfaces that need to be built, how they connect, and the design language to carry through all of them.

---

## 0. The Big Picture

Right now you have one screen: a chat interface. You're pivoting to **three connected surfaces** that tell a story judges can follow:

1. **OpsPilot marketing site** — the product itself, sold on its own merits (this is what "you" are building as a company)
2. **GrowMart storefront** — a fictional D2C e-commerce client, used as a live case study, with the OpsPilot chat widget embedded exactly like a real customer would encounter it
3. **OpsPilot Admin Console** — the "backstage" view, logged in as GrowMart's ops team, showing tickets, analytics, and CRM — proving this isn't just a chatbot, it's a business tool

The throughline for judges: **"Here's the product (1) → here's it live on a real storefront (2) → here's what the business sees behind the scenes (3)."** That's a demo narrative, not just a feature tour.

Routes:
```
/                      → OpsPilot marketing/landing page
/growmart              → GrowMart storefront homepage (OpsPilot widget embedded)
/growmart/products     → Product listing
/growmart/products/:id → Product detail
/growmart/cart         → Cart (lightweight)
/growmart/checkout     → Checkout (lightweight, can be a single confirmation-style page)
/admin                 → OpsPilot admin login
/admin/dashboard       → Analytics (your existing Screen 3)
/admin/tickets         → Live conversations needing review/escalation
/admin/crm             → Leads view (your existing Screen 4)
/admin/kb              → Knowledge base viewer (your existing Screen 5)
```

Your existing chat screen (Screen 2) becomes the **widget**, not a standalone page — it should be buildable as a component that mounts inside `/growmart/*` pages (bottom-right launcher → expands to the chat + trace panel), reusable and self-contained so you're not duplicating logic.

---

## 1. Design Language (applies everywhere)

Keep what's already working (dark command-center feel, agent color-coding, monospace trace details) but apply it with more range:

- **OpsPilot marketing site**: dark-mode-first, near-black `#0B0E14`, one accent (electric blue/violet), generous whitespace, big confident type. This should feel like Linear or Vercel's marketing site — product-led, technical credibility, not generic SaaS.
- **GrowMart storefront**: a **completely different palette** — light, warm, retail-friendly (think a real D2C shop: off-white background, a warm accent like coral or amber, product photography-forward). This contrast is intentional: it proves OpsPilot is a layer that adapts to *any* brand, not a one-look product. The widget itself should carry a thin GrowMart-branded skin (their accent color on the launcher button, "Chat with GrowMart" label) while the trace panel underneath stays OpsPilot's dark technical style — this juxtaposition is a great live talking point ("the widget wears the client's branding, the reasoning panel is ours").
- **Admin console**: same dark command-center system as your current build — this is OpsPilot's own product surface, so it should look identical in DNA to the marketing site, just data-dense instead of narrative.
- Typography: Inter or Geist throughout, monospace only for trace/technical log lines.
- Motion: subtle fades/slides only — no bounce.

---

## 2. OpsPilot Marketing Site (`/`)

Make this genuinely scrollable — a real product site with 6–8 sections, not a hero + CTA. Structure:

### Section 1 — Hero
- One-line pitch: *"One AI team for sales, support, and care — that actually gets things done."*
- Subhead: 1-2 sentences on the orchestrator + specialist agent model.
- Primary CTA: **"See OpsPilot in action on GrowMart →"** (routes to `/growmart`)
- Secondary CTA: "View live architecture" (scrolls down or routes to `/admin` demo login)
- Background: subtle animated trace-panel-style ticker (fake events scrolling, e.g. `Support Agent → resolved via KB`) — this single element instantly shows the differentiator before anyone scrolls.

### Section 2 — Problem statement
- 3-column: "Slow response times" / "Inconsistent follow-up" / "Support burnout" — the pain points OpsPilot solves, framed generically (not GrowMart yet).

### Section 3 — How it works (architecture)
- Visual diagram: Orchestrator → 4 specialist agents → tools (CRM, refunds, calendar, KB). Reuse your Screen 6 content here, styled as a marketing diagram rather than a docs page.
- Short copy per agent: name, responsibility, one guardrail (e.g., "Care Agent escalates refunds over $500 to a human").

### Section 4 — Live Reasoning (the differentiator)
- This is where you sell the trace panel specifically. Screenshot or embed a live mini-demo (even a looping animated mock is fine) showing the timeline: `🟢 Orchestrator → routed to Support Agent` etc.
- Copy: "Most AI chat tools are a black box. OpsPilot shows its work — every tool call, every retrieval, every decision, in real time."

### Section 5 — **GrowMart × OpsPilot case study** (new, this is the one you asked for)
This section needs its own visual identity — treat it like a mini case-study card, distinct from the rest of the dark page (e.g., a light-background inset panel using GrowMart's warm palette, signaling "this is a different brand living inside our product").
- Framing copy (adapt from your seed data):
  > "GrowMart is a growing D2C electronics brand doing ~500 orders/day with a 4-person support team drowning in pre-sale questions, post-sale issues, and refund requests across email, WhatsApp, and a help desk. We embedded OpsPilot directly into their storefront."
- 3 stat callouts (use your dashboard's demo numbers): resolution rate, avg handling time, estimated hours saved/week.
- CTA button: **"Try the GrowMart demo →"** → `/growmart`

### Section 6 — Scalability / "built for real business"
- Talking points: multi-tenant ready (any brand's storefront could embed the same widget), real tool integrations (not fake delays), guardrails for responsible automation.

### Section 7 — Footer CTA
- Repeat the primary CTA + a secondary "View Admin Console" link for judges who want to jump straight to the backstage view.

---

## 3. GrowMart Storefront (`/growmart/*`)

This needs to feel like a real, if modest, e-commerce site — enough that the OpsPilot widget feels like it's living somewhere real, not floating on a blank page.

### `/growmart` — Homepage
- Header: GrowMart logo/wordmark, nav (Shop, About, Support), cart icon
- Hero banner: seasonal promo styling ("New: MagCharge 15W — now in stock")
- Featured products grid (4-6 cards pulled from your seeded product catalog) — image, name, price, "View" button
- Trust row: shipping/returns/warranty blurbs (ties directly into your KB categories — nice continuity)
- OpsPilot widget launcher: bottom-right floating button, GrowMart-accent-colored, label "Chat with us"

### `/growmart/products` — Product listing
- Grid of all 5-8 seeded products, filter/sort optional (by price band — reuse the ₹500–1000 / ₹1000–2000 / ₹2000+ bands from your sales agent logic, nice continuity between UI and agent behavior)

### `/growmart/products/:id` — Product detail
- Image, name, price, features, compatible accessories, stock status (straight from your seed data)
- "Add to cart" button
- A contextual prompt near the buy button: *"Not sure if this fits your setup? Ask OpsPilot"* → opens widget pre-seeded with a relevant scenario message — this is a great live demo trigger, more natural than a generic launcher click

### `/growmart/cart` and `/growmart/checkout`
- Keep lightweight: cart is a simple line-item list + quantity + total; checkout can be a single-page mock (shipping info form → "Place order" → confirmation screen with a fake order ID in your `GM-XXXXX` format). No real payment needed — this isn't the demo's focus, it just needs to exist so the storefront feels complete and so you can generate a real order ID to reference in a live Care Agent refund demo.

### Widget integration details
- Build the widget as a self-contained component (`<OpsPilotWidget />`) so it can mount on any `/growmart/*` page without prop drilling — it should manage its own session_id/WebSocket connection internally.
- Collapsed state: floating launcher button, bottom-right, GrowMart accent color.
- Expanded state: your existing chat + trace panel layout, but scoped to a panel (not full-screen) — e.g., slides up from bottom-right, ~400px wide, ~600px tall, with its own "minimize" control.
- Keep the "Show/Hide reasoning" toggle — default ON for your demo, but this is also a nice UX bit to point out: "customers can hide the reasoning panel; we leave it on for judges."
- Scenario picker dropdown (Sales / Support / Escalation) stays inside the widget, useful for smooth live demoing without dead air.

---

## 4. OpsPilot Admin Console (`/admin/*`)

This is where you prove scalability and real business value — logged in as GrowMart's ops team, using OpsPilot's own backstage tools.

### `/admin` — Login
- Simple branded login screen (OpsPilot logo, "Sign in to your workspace", GrowMart pre-filled as the demo org — no real auth needed, just a gate so it reads as a real product moment rather than an open page).

### `/admin/dashboard` — Analytics (your Screen 3, keep as-is)
- Stat cards, conversations-per-agent chart, recent activity table — reuse what you already spec'd.

### `/admin/tickets` — **New: live conversations needing review**
This is the piece that makes "admin" feel real rather than just a read-only dashboard:
- Table/list of conversations flagged for human attention: escalated care cases (refund > $500 threshold), unresolved support threads, scheduling requests pending confirmation.
- Each row: customer name, issue summary, agent involved, status (Pending review / Escalated / Resolved), timestamp.
- Click into a ticket → full conversation transcript + the trace log for that conversation (reuse your trace panel rendering) + an action button appropriate to the state (e.g., "Approve refund" for the threshold-escalation case — this is your guardrail payoff, made concrete and clickable instead of just a talking point).

### `/admin/crm` — Leads view (your Screen 4, keep as-is)

### `/admin/kb` — Knowledge base viewer (your Screen 5, keep as-is)

### Admin nav shell
- Persistent left sidebar (Dashboard / Tickets / CRM / Knowledge Base), GrowMart branding in the header ("GrowMart workspace"), small "Powered by OpsPilot" mark — matches your current app's shell, just extended with the Tickets section.

---

## 5. Suggested Build Order (given 3+ days)

1. **Day 1**: Admin shell + Tickets screen (new — highest-value new surface, reuses your existing trace rendering logic so it's mostly plumbing, not new design)
2. **Day 1-2**: Marketing site sections 1–4 (hero through architecture) — mostly static content, fast to build, high visual payoff
3. **Day 2**: GrowMart storefront homepage + product listing + product detail
4. **Day 2-3**: Extract chat screen into `<OpsPilotWidget />`, embed on storefront pages, wire the "ask OpsPilot" contextual trigger on product detail
5. **Day 3**: Marketing site section 5 (GrowMart case study) + cart/checkout lightweight flow + polish pass across all three surfaces
6. **Buffer**: rehearse the demo narrative end-to-end — marketing site → click into GrowMart → trigger widget → flip to `/admin/tickets` and show the same conversation from the ops side. That loop *is* your demo.

---

## 6. What NOT to change

- Keep your existing LangGraph orchestration, streaming, and memory architecture exactly as-is — this redesign is purely front-end surface area and routing, not a backend rework.
- Keep your existing trace panel event rendering logic — just make it mountable inside a smaller widget container as well as (optionally) a full page for the admin ticket-detail view.
