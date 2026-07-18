# OpsPilot × GrowMart

**One AI ops team for sales, support, and care — that actually gets things done.**

OpsPilot is a multi-agent AI platform built for the FlowZint AI Hackathon 2026. It replaces a fragmented support stack with a single orchestrated system of specialist AI agents, each with real tool access. The demo runs as GrowMart's live customer operations layer — embedded directly in a working e-commerce storefront.

---

## Demo narrative

```
/ (OpsPilot marketing site)
  → /growmart (GrowMart storefront — widget live in the bottom-right)
    → chat with the agent, browse products, add to cart, checkout
  → /admin (OpsPilot admin console — ops team view)
    → watch the same conversation from the other side
    → approve escalated refunds, view leads, browse the KB
```

---

## What makes it different

Most AI chat demos are a black box — you see the response but not how it got there. OpsPilot shows its work.

Every agent turn produces a live **Agent Reasoning panel**: which agent ran, which tool it called, what it retrieved, what threshold it hit, and what action it took — in real time, as it happens. This is not a post-hoc log. It streams token by token alongside the response.

The widget wears GrowMart's branding (coral accent, warm palette). The reasoning panel stays OpsPilot's own design (cool gray, monospace). The visual seam between them is the product's identity in one glance.

---

## Architecture

```
User message (WebSocket)
        │
        ▼
┌─────────────────────┐
│    Orchestrator      │  classifies intent → routes to specialist
│    (LangGraph)       │  sticky routing: mid-task messages skip re-classification
└────────┬────────────┘
         │
    ┌────┴──────────────┬──────────────┬──────────────┐
    ▼                   ▼              ▼               ▼
Sales Agent        Support Agent   Care Agent   Scheduling Agent
    │                   │              │               │
    ▼                   ▼              ▼               ▼
Airtable CRM      ChromaDB RAG    Supabase +     Google Calendar
(leads)           (KB articles)   Refund logic   (real bookings)
```

Streaming events flow over a single WebSocket connection:
- `token` — LLM output for the chat bubble
- `trace` — agent/tool events for the reasoning panel
- `action` — real-world effects (`cart_updated`, `refund_issued`)
- `status` — transient toasts (e.g. "Summarising context…")

---

## Tech stack

| Layer | Technology |
|---|---|
| Orchestration | LangGraph (Python) — conditional routing, sticky agent memory |
| LLM | Gemini 2.0 Flash Lite via `langchain-google-genai` |
| Backend | FastAPI + uvicorn, WebSocket streaming |
| Vector DB | ChromaDB (local) — 20 KB articles, RAG retrieval |
| Primary DB | Supabase (PostgreSQL) — orders, cart, wallet, tickets, history |
| CRM | Airtable REST API — sales leads |
| Calendar | Google Calendar API — real callback bookings |
| Frontend | React 19 + Vite + Tailwind v4 |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Agents

### Orchestrator
Classifies every incoming message into one of: `sales`, `support`, `care`, `scheduling`, `unclear`. Uses the last 4 conversation turns as context so short follow-ups ("GM-10234", "yes please") are correctly routed. Implements **sticky routing** — once an agent is mid-task, the next user message goes directly back to that agent without re-classification. Rolls up a conversation summary when history exceeds 16 messages (removes old messages cleanly using LangGraph's `RemoveMessage`).

### Sales Agent
Qualifies visitors on device compatibility, budget (₹500–1000 / ₹1000–2000 / ₹2000+), and use case. Recommends 1–2 products from the catalog. When the customer confirms they want to buy, calls `add_to_cart` — which writes directly to Supabase and triggers a frontend navigation to `/growmart/cart`. Creates a CRM lead in Airtable for visitors who aren't ready to purchase.

### Support Agent
Retrieves from a 20-article ChromaDB knowledge base before generating any response. Every answer is grounded in retrieved context — the agent will say "I don't have that information" rather than guess. Articles cover: shipping, returns, warranty, troubleshooting (WiFi, charging, Bluetooth), account management. Escalates to the Scheduling Agent after 2 unresolved turns or on detected frustration keywords.

### Care Agent
Handles refund and complaint flows with mandatory follow-up steps before acting:
1. Acknowledge the issue
2. Ask what's wrong (defective / damaged / wrong item / changed mind)
3. Look up the order via `lookup_order_details`
4. Check eligibility via `check_refund_eligibility`
5. **Auto-refund if ≤ ₹1,500** — calls `issue_order_refund`, credits the wallet in Supabase, emits a `refund_issued` action event so the frontend wallet balance updates live with a rising green coin animation
6. **Escalate if > ₹1,500** — creates a ticket in Supabase with the full conversation transcript and agent trace attached, routes to the Scheduling Agent for a callback. The ticket immediately appears in `/admin/tickets` for the ops team.

### Scheduling Agent
Books real Google Calendar events. Shows 2–3 available 30-minute slots in business hours, confirms the customer's preferred time, calls `confirm_booking` — which creates an actual calendar event with the customer as an attendee. Reached directly (user asks for a callback) or via escalation from Support/Care.

---

## Features

### GrowMart Storefront (`/growmart/*`)

**Product catalog** — 6 products seeded with real descriptions, features, compatible accessories, and stock status. Filter by price band on the listing page.

**Product detail** — "Not sure if this fits your setup? Ask our agent" button auto-opens the chat widget and fires a pre-written contextual question about that specific product.

**Cart** — persisted to Supabase. Adding via the widget (agent confirms add) or the "Add to cart" button both write to the same DB row. Cart count badge updates live in the header.

**Checkout + mock payment** — form → payment modal with a dummy test card (4242 4242 4242 4242, non-editable, clearly labelled). 2-second fake processing → success → order written to Supabase → wallet debited → cart cleared. Confirmation screen shows the real `GM-XXXXX` order ID, immediately look-up-able by the Care Agent.

**GrowMart Wallet** — ₹5,000 starting balance. Debited on checkout, credited on refund. Balance shown in the header with a green flash animation when a refund lands. Full transaction history visible in the account menu.

**Account menu** — avatar button top-right. Links to:
- **Orders** — all orders from Supabase with status badges and per-order "Get help" / "Request refund" buttons that auto-open the widget
- **Wishlist** — pre-seeded with EchoBuds Pro and SmartWatch Series 2
- **Cart** — with item count
- **Chat history** — past conversations saved to Supabase after each turn, with agent, outcome, and summary
- **Open tickets** — escalated issues visible to the customer with status; includes a link to the admin view
- **Switch to Admin Console** — sets the admin role and navigates to `/admin/dashboard`

**OpsPilot widget** — floating bottom-right launcher. Expands to a resizable panel (drag the top-left grip). Warm off-white chat area on the left; cool gray Agent Reasoning panel on the right. Toggle reasoning on/off. Scenario picker dropdown for smooth live demos. Auto-opens when any "Ask agent" button is clicked, pre-fills the message, and sends it immediately.

---

### OpsPilot Admin Console (`/admin/*`)

**Role-gated** — visiting `/admin/*` as a customer shows a gate page explaining the role separation. Login (pre-filled, one click) or "Switch to Admin Console" from the customer menu sets the admin role.

**Dashboard** — stat cards (248 conversations, 87% resolution rate, 1m 42s avg handling, 13% escalation, 41 hrs/week saved), agent breakdown bar chart, recent activity table with agent badge and outcome badge.

**Tickets** — live from Supabase. Each row: customer name, ticket ID, issue summary, agent involved, status, amount, date. Click through to:
- Full conversation transcript
- Agent reasoning trace (reuses the same `TraceRow` component as the widget)
- Action button: **Approve refund** (for escalated care tickets) or **Resolve** — calls `POST /api/admin/tickets/:id/resolve`, updates Supabase status, credits the customer's wallet, returns the new balance. No page reload needed.
- Refresh button to pull new tickets

**CRM** — live from Airtable via a backend proxy. Every lead the Sales Agent creates appears here in real time. Columns: name, email, product interest, stage (New/Contacted/Qualified), notes, created date.

**Knowledge Base** — 20 articles displayed as cards with tags. "Recently referenced" articles are highlighted with an indigo badge (articles used in live conversations). Searchable by title or tag.

---

### Agent Reasoning Panel (the differentiator)

Streams in real time alongside every response. Each event is a colored left-border rule keyed to the agent:

| Agent | Color | Example event |
|---|---|---|
| Orchestrator | Slate | `classified intent → care` |
| Sales | Indigo | `create_lead — Aditi Sharma` |
| Support | Emerald | `kb_search — 3 articles retrieved` |
| Care | Violet | `issue_refund — ₹899 — done` |
| Scheduling | Amber | `book_slot — Jul 15 10:00 — confirmed` |

Tool calls, retrieved sources, eligibility checks, escalation reasons, ticket IDs — all visible. The panel is collapsible ("Reasoning off") so it doubles as a clean customer-facing widget when hidden.

---

## Guardrails (responsible AI)

- **Refund threshold** — refunds above ₹1,500 are never auto-issued. They create a ticket in the admin queue and route to the Scheduling Agent for a human callback. The guardrail is enforced in tool logic (`requires_manual_approval()`), not just the system prompt — the LLM cannot bypass it.
- **Support grounding** — the Support Agent answers only from retrieved KB context. If the context doesn't cover the question, it says so and offers to escalate. It cannot hallucinate policy details.
- **Confirmation before cart** — the Sales Agent asks "Want me to add [product] to your cart?" and waits for explicit confirmation before calling `add_to_cart`. It never adds on interest alone.
- **Follow-up before refund** — the Care Agent asks what's wrong before checking eligibility. It won't auto-refund on an order ID alone.
- **Frustration detection** — the Support Agent detects keywords ("frustrated", "speak to a human", "this is ridiculous") and escalates proactively rather than continuing to fail.

---

## Project structure

```
OpsPilot-FlowZint/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py      # intent classification + rolling summarisation
│   │   ├── sales_agent.py       # product recommendation, CRM lead, add-to-cart
│   │   ├── support_agent.py     # RAG-grounded KB answers
│   │   ├── care_agent.py        # refund flow with tiered approval
│   │   └── scheduling_agent.py  # Google Calendar booking
│   ├── tools/
│   │   ├── db.py                # Supabase client — all storefront data
│   │   ├── refunds.py           # order lookup + refund issuance via Supabase
│   │   ├── tickets.py           # escalation ticket creation
│   │   ├── crm.py               # Airtable leads API
│   │   ├── calendar.py          # Google Calendar API
│   │   └── kb_search.py         # ChromaDB vector search
│   ├── ingestion/
│   │   └── ingest_kb.py         # embeds KB articles into ChromaDB
│   ├── kb/                      # 20 GrowMart support articles (Markdown)
│   ├── graph.py                 # LangGraph graph: nodes, edges, sticky routing
│   ├── state.py                 # AgentState TypedDict
│   ├── main.py                  # FastAPI app, WebSocket, REST API
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── widget/
│   │   │   │   └── OpsPilotWidget.jsx   # self-contained chat + trace widget
│   │   │   └── growmart/
│   │   │       └── GrowmartHeader.jsx   # nav + account menu + wallet
│   │   ├── pages/
│   │   │   ├── MarketingPage.jsx        # OpsPilot product site (/)
│   │   │   ├── growmart/                # storefront pages
│   │   │   └── admin/                  # admin console pages
│   │   ├── context/
│   │   │   ├── StoreContext.jsx         # cart, wallet, orders — Supabase-backed
│   │   │   └── AuthContext.jsx          # customer / admin role switching
│   │   ├── hooks/
│   │   │   └── useChatSocket.js         # WebSocket state management
│   │   └── utils/
│   │       ├── api.js                   # typed fetch wrappers for /api/*
│   │       └── constants.js             # products, agents, demo scenarios
│   ├── vercel.json                      # SPA rewrite rules
│   └── package.json
│
├── supabase_schema.sql            # run once in Supabase SQL Editor
├── render.yaml                    # Render service definition
├── .env.example                   # template — copy to .env
└── .gitignore
```

---

## Local development

```bash
# 1. Clone and enter the repo
git clone https://github.com/YOUR_USERNAME/OpsPilot-FlowZint.git
cd OpsPilot-FlowZint

# 2. Python virtualenv
python3 -m venv myenv
source myenv/bin/activate
pip install -r backend/requirements.txt

# 3. Environment variables
cp .env.example .env
# Edit .env with your keys

# 4. Seed the database (run once)
python -m backend.tools.db

# 5. Ingest the knowledge base (run once)
python -m backend.ingestion.ingest_kb

# 6. Start the backend
uvicorn backend.main:app --reload --port 8000

# 7. Start the frontend (separate terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Environment variables

| Variable | Where to get it | Used by |
|---|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) | All agents |
| `GOOGLE_API_KEY` | Same as above | LangChain Gemini client |
| `AIRTABLE_API_KEY` | [Airtable developer tokens](https://airtable.com/create/tokens) | Sales Agent (leads) |
| `AIRTABLE_BASE_ID` | Airtable base URL | Sales Agent |
| `AIRTABLE_TABLE_NAME` | `Leads` | Sales Agent |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | GCP console → IAM → Service accounts | Calendar (local) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Contents of the JSON key file | Calendar (cloud/Render) |
| `GOOGLE_CALENDAR_ID` | Google Calendar settings → Calendar ID | Scheduling Agent |
| `SUPABASE_URL` | Supabase → Settings → API | All DB operations |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role | All DB operations |
| `ALLOWED_ORIGINS` | Your Vercel URL | CORS (backend) |

---

## Deployment

See the deployment guide at the bottom of this file, or follow the quick steps:

**Backend → Render**
1. New Web Service → connect repo
2. Build: `pip install -r backend/requirements.txt`
3. Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add all env vars in Render dashboard

**Frontend → Vercel**
1. Import repo → set Root Directory to `frontend`
2. Add `VITE_API_URL` and `VITE_WS_URL` pointing to your Render URL
3. Deploy

After both are live, update `ALLOWED_ORIGINS` on Render to your Vercel URL and redeploy.

---

## Demo scripts

### Script 1 — Sales flow (lead created)
```
"Hi, I'm looking for a wireless charger for my iPhone 15. Budget around ₹1500."
→ agent qualifies (case thickness, personal/gift)
→ recommends MagCharge 15W
→ "Yes, add it to my cart"
→ cart updates, widget navigates to /growmart/cart
```

### Script 2 — Support (resolved via KB)
```
"My GrowMart SmartPlug won't connect to WiFi. I've tried restarting it three times."
→ agent retrieves KB article #9 (SmartPlug WiFi troubleshooting)
→ answers with 2.4GHz band switch steps
→ resolved in one turn
```

### Script 3 — Tiered refund (auto-approved ≤ ₹1,500)
```
"I'd like a refund for order #GM-10239. The SmartPlug arrived damaged."
→ agent asks follow-up: what's wrong?
→ "damaged"
→ looks up GM-10239 (₹549)
→ eligibility check: within threshold → auto-refund
→ wallet credited ₹549, rising coin animation fires
```

### Script 4 — Tiered refund (escalated > ₹1,500)
```
"I'd like a refund for order #GM-10237. The charger stopped working after a week."
→ agent asks follow-up
→ looks up GM-10237 (₹3,499)
→ eligibility check: above ₹1,500 threshold → ticket created
→ flip to /admin/tickets → ticket appears
→ click "Approve refund" → wallet credits ₹3,499 live
```

### Script 5 — Scheduling (callback booked)
```
"I need to speak to someone about a billing issue. Can you book a callback?"
→ agent fetches real Google Calendar slots
→ customer picks a time
→ real calendar event created, confirmation shown
```

---

## Judging criteria alignment

| Criterion | What demonstrates it |
|---|---|
| **Innovation** | Live agent reasoning panel — most demos hide the AI's decision process. Ours makes it the centrepiece. |
| **Real-world problem solving** | Tiered refund guardrail (₹1,500 threshold), human-in-the-loop ticket queue, frustration detection escalation — real business logic, not toy flows. |
| **AI Automation** | 5 agents with real tool access. Refunds hit the DB. Leads land in Airtable. Calendars get booked. Cart is updated. Nothing is faked with setTimeout. |
| **User experience** | Three distinct visual surfaces (marketing/dark, storefront/warm, admin/dark-dense), widget with resizable panel, streaming chat, refund animation, account menu with live wallet balance. |
| **Scalability** | Widget accepts `brand_config` (colors, name) as props — any brand can embed it. Supabase scales without config changes. Orchestrator architecture supports adding agents without touching routing logic. |

---

*Built for FlowZint AI Hackathon 2026 — Open Innovation category*
*Submission: [flowzint.in/2026/ai/hackothon](https://flowzint.in/2026/ai/hackothon)*
