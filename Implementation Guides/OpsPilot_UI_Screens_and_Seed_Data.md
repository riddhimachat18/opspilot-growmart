# OpsPilot — UI Screens & Seed Data Reference

---

## Part 1: UI Screens

### Overall Theme Direction

Go for a **"modern ops command center"** feel — not a cutesy chatbot UI, but something that looks like it belongs in a real business's toolstack (think Linear, Intercom, or Notion's cleanliness, crossed with a monitoring dashboard's sense of "live system at work").

- **Palette:** dark-mode-first (dark slate/near-black background, e.g. `#0B0E14`), with a single accent color for primary actions (an electric blue or violet works well against dark backgrounds), and a distinct color per agent so judges can track who's "speaking" at a glance:
  - Orchestrator — neutral gray/white
  - Sales Agent — blue
  - Support Agent — green
  - Care Agent — purple/magenta
  - Scheduling Agent — orange/amber
- **Typography:** one clean sans-serif (Inter or Geist), tight letter spacing for headers, monospace font *only* for the trace panel's technical log lines (tool calls, API responses) — this small detail visually signals "real system," not "toy chatbot."
- **Motion:** subtle — fade/slide-in for new trace events, a soft pulsing dot for "agent is working," no bouncy or playful animation. The tone should feel competent and calm, like enterprise software, not like a consumer app.
- **Layout language:** generous whitespace, rounded-lg cards (not fully rounded/bubbly), thin 1px borders instead of heavy drop shadows.

---

### Screen 1: Landing / Marketing Page
**Purpose:** first thing judges see before they even try the demo — sets expectations and frames the problem.
- Hero section: one-line pitch ("One AI team for sales, support, and care — that actually gets things done"), with GrowMart framing subtly present ("Built for teams like GrowMart's")
- Short 3-icon row: "Talks to customers" / "Takes real action" / "Escalates when it should"
- CTA button: "Try the Live Demo" → goes to the chat screen
- Small architecture diagram or GIF preview of the trace panel in action — this single visual pre-sells the differentiator before judges even click in

### Screen 2: Main Chat Interface (core demo screen)
**Purpose:** where 90% of your live demo happens.
- **Left/center panel:** chat window — message bubbles, streaming text, a persistent input box, and a small "Currently talking to: [Agent Name]" chip above the input that updates as routing happens
- **Right sidebar: Agent Trace Panel** (your signature feature)
  - Vertical timeline, newest event at bottom (auto-scrolls), each entry has: colored agent tag, icon (spinner → checkmark), short label, monospace detail line
  - Example entries: `Orchestrator — classifying intent`, `Support Agent — searching knowledge base (3 results)`, `Care Agent — calling refund API`, `✅ Refund issued: $42.00`
- **Top bar:** GrowMart branding (since this is "GrowMart's AI ops layer"), a session reset button, and a subtle "Powered by OpsPilot" mark
- **Trace panel toggle**: a small switch/button in the top bar ("Show Agent Reasoning") that shows/hides the right-side Agent Trace Panel — default ON for demos to judges, but lets the UI double as a clean customer-facing chat when toggled OFF
- Optional: a small "scenario picker" dropdown (Sales / Support / Escalation) pre-filled with example prompts — makes live demoing fast and reduces risk of dead air while typing

### Screen 3: Dashboard / Analytics
**Purpose:** proves scalability and business value beyond a single conversation — this is what makes judges think "this could actually be deployed."
- Top stat cards: Total Conversations, Resolution Rate, Avg. Handling Time, Escalation Rate, Estimated Hours Saved
- A simple line/bar chart: conversations per agent type over the demo period
- A recent activity table: timestamp, agent involved, outcome (resolved / escalated / lead created)
- Optional: a "cost/time saved" calculator framing — e.g., "at GrowMart's current ticket volume, this would save ~X hours/week"

### Screen 4: CRM / Leads View (mock, but real Airtable-backed)
**Purpose:** shows the Sales Agent's output isn't just chat text — it's structured business data.
- Simple table: Name, Email, Interest, Stage (New/Contacted/Qualified), Notes, Created At
- Highlight the most recently created lead (from your live demo) so judges see it appear in real time if you flip to this tab mid-demo

### Screen 5: Knowledge Base Viewer (optional but nice)
**Purpose:** transparency — lets judges see exactly what the Support Agent is grounded in, reinforcing the "no hallucination" pitch.
- Simple list/grid of KB articles (title + short excerpt), searchable
- When an article is used in a live conversation, you can optionally highlight/badge it as "Recently referenced"

### Screen 6: Agent Config / "How It Works" Screen (optional, strong for judges)
**Purpose:** many hackathon judges want to see architecture, not just outputs. This screen does double duty as documentation and as a "look how thoughtful this is" moment.
- Visual diagram of the orchestrator → agent → tool flow (can literally embed your architecture diagram)
- Short cards per agent: name, responsibility, tools it has access to, guardrails (e.g., "Care Agent cannot auto-approve refunds over $500")
- This screen substitutes well for slides — you can present directly from your live app instead of switching to a slide deck

---

## Part 2: Seed Data Checklist

Seed data quality matters more than most teams realize — generic Lorem-ipsum-style data makes even a great architecture look like a toy. Everything below should be written specifically for **GrowMart**, with real-sounding names, prices, and policies.

### 1. Product Catalog (5–8 products)
Used by the Sales Agent for recommendations.
- Fields: name, category, price, key features, compatible accessories, stock status
- Example: "GrowMart MagCharge 15W Wireless Charger — ₹1,499 — case-friendly, 15W fast charging, compatible with all Qi devices"
- Include a range of price points so the Sales Agent's "budget qualification" step has something meaningful to branch on

### 2. Knowledge Base Articles (15–25 articles)
Used by the Support Agent for RAG retrieval. This is the single most important seed dataset — invest real time here.
- Categories to cover:
  - **Setup/troubleshooting** (e.g., "Smart plug won't connect to WiFi," "Charger not fast-charging," "Resetting your device")
  - **Shipping & delivery** (timelines, tracking, delayed order policy)
  - **Returns & refunds policy** (window, eligibility, non-returnable items, refund timeline)
  - **Account & orders** (how to change an address, cancel an order, apply a coupon)
  - **Warranty** (coverage period, what's covered, how to claim)
- Each article: title, 100–200 word body, 2–3 tags — enough substance that retrieval genuinely needs to pick the *right* one, not just any one

### 3. Mock CRM / Leads Table (seed 3–5 existing leads, rest generated live)
- Fields: Name, Email, Company (optional), Interest, Stage, Notes, Created At
- Seed a few pre-existing leads so the CRM screen doesn't look empty before your live demo adds more
- Example: "Aditi Sharma — aditi@example.com — Interested in smart plugs for home automation — Stage: Contacted"

### 4. Mock Orders Table (8–12 orders)
Used by the Care Agent to look up orders for refund/complaint flows.
- Fields: Order ID, Customer Name, Product(s), Amount, Order Date, Status (Delivered/Processing/Delayed)
- Include a deliberate spread:
  - 1–2 orders **under** your refund auto-approval threshold (e.g., $500) — for the smooth auto-refund demo path
  - 1–2 orders **over** the threshold — for the escalation-to-human demo path
  - 1 delayed/problem order — for a "where's my order" support scenario
- Example: "Order #GM-10234 — Rohan Verma — GrowMart SmartPlug Duo Pack — ₹899 — Delivered — Jul 3, 2026"

### 5. Customer/User Profiles (3–5 personas)
Used to make conversations feel personal and to test memory/context features.
- Fields: name, email, past order history, past support interactions (if you're demoing memory/context continuity)
- Give each persona a distinct "vibe" for demo variety: one easy-going first-time buyer, one frustrated repeat-issue customer, one high-value customer with a big order

### 6. Sample Conversation Scripts (3 full scripts, one per demo scenario)
Not seeded into the database, but written out in advance so your live demo is smooth and repeatable.
- Script 1: Pre-sale → Sales Agent → lead created
- Script 2: Post-sale issue → Support Agent → resolved via KB
- Script 3: Repeat complaint → Care Agent → escalation → Scheduling Agent books callback
- Write the exact phrases you'll type live, and test each one multiple times before demo day to make sure routing and tool calls behave consistently

### 7. Calendar Availability (seed a few open slots)
Used by the Scheduling Agent.
- Block out a few real available time slots in the connected Google Calendar over the days you'll be demoing, so the "book a callback" flow always has something to offer live

### 8. Analytics/Dashboard Backing Data
Since your dashboard needs numbers even before real usage accumulates:
- Either log real stats from your own testing conversations over the build period (most authentic — you can honestly say "this is from our own test traffic")
- Or clearly label a small synthetic dataset as "simulated data based on GrowMart's stated ticket volume" — be upfront about this if asked, judges respect honesty over inflated claims
