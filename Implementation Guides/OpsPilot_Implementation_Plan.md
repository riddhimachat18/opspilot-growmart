# OpsPilot — Detailed Implementation Plan
### Multi-Agent AI Operations Platform for FlowZint AI Hackathon 2026

---

## 1. Project Summary

OpsPilot is a multi-agent AI platform that handles sales, support, and customer care through specialist agents coordinated by an orchestrator. Unlike a standard chatbot, every agent has real tool access (mock CRM, mock payments, real calendar) and every action is visible in real time through a live "Agent Trace" panel, so the user and the judges can watch the system reason and act, not just talk.

**Tech stack (recommended):**
- Orchestration: **LangGraph** (Python) — easiest agentic framework to reason about as a graph, good docs, native support for conditional routing and tool calls
- LLM: Claude (Sonnet) via Anthropic API, or GPT-4o via OpenAI API — whichever your team has credits for
- Backend: **FastAPI** (Python) with WebSocket support for streaming agent traces
- Frontend: **React + Vite + Tailwind**, WebSocket client for live trace panel
- Vector DB: **ChromaDB** (local, zero setup) for RAG knowledge base
- Mock CRM: **Airtable** (free tier, has a REST API) or a local SQLite table styled as a CRM
- Mock payments/refunds: **Stripe test mode** (free, real API, fake money)
- Calendar: **Google Calendar API** (real, free, OAuth is quick to set up)
- Deployment: **Vercel** (frontend) + **Render/Railway** (backend) — both have generous free tiers and deploy in minutes

---

## 2. Architecture Overview

```
User Message
     │
     ▼
┌─────────────────┐
│  Orchestrator    │  ← classifies intent, decides routing
│  Agent (LangGraph│
│  graph entrypoint)│
└────────┬─────────┘
         │
   ┌─────┼─────┬───────────┐
   ▼     ▼     ▼           ▼
 Sales  Support Care   Scheduling
 Agent  Agent   Agent   Agent
   │     │       │           │
   ▼     ▼       ▼           ▼
 Mock   RAG +   Stripe    Google
 CRM    KB      API       Calendar
 API   Search   (refund)  API
         │
         ▼
   All agent steps emitted as events over WebSocket
         │
         ▼
   Frontend renders: chat bubble + live trace panel
```

Every node in the LangGraph graph emits a structured event (`{agent, action, status, detail}`) to the frontend via WebSocket as it executes. This is the single most important piece of plumbing in the whole project — build it early.

---

## 3. Environment & Repo Setup (Day 1)

1. Create a monorepo:
   ```
   opspilot/
     backend/
       agents/
       tools/
       kb/
       main.py
       requirements.txt
     frontend/
       src/
     README.md
     .env.example
   ```
2. Set up Python virtual environment, install: `langgraph`, `langchain`, `anthropic` (or `openai`), `fastapi`, `uvicorn`, `chromadb`, `python-dotenv`, `websockets`.
3. Set up frontend: `npm create vite@latest frontend -- --template react`, install `tailwindcss`, `socket.io-client` or plain `WebSocket` API, `lucide-react` for icons.
4. Get API keys: Anthropic/OpenAI, Stripe test keys, Airtable API key + base, Google Calendar OAuth credentials.
5. Put all keys in `.env`, never commit them. Add `.env.example` with blank values so judges can see what's needed.
6. Set up a shared `docs/architecture.md` early — you'll reuse this for your final submission writeup.

---

## 4. Build the Orchestrator First (Days 2–3)

The orchestrator is a LangGraph graph with one entry node that classifies intent and routes.

**Steps:**
1. Define a `state` object shared across the graph: `{ messages, user_id, current_agent, trace_log }`.
2. Write the classifier node: a single LLM call with a system prompt like:
   > "Classify this message into one of: sales, support, care, scheduling, unclear. Respond with only the label."
3. Use LangGraph's conditional edges to route to the matching agent node based on the classifier's output.
4. If `unclear`, route to a clarification node that asks the user a follow-up question instead of guessing.
5. Wire a callback/event emitter at every node transition: before an agent starts working, emit `{status: "started", agent: "support"}`; when it calls a tool, emit `{status: "tool_call", tool: "kb_search", input: "..."}`; when it finishes, emit `{status: "done", output: "..."}`.
6. Test the orchestrator alone with hardcoded fake agents that just echo back "I would have handled this" — confirm routing works before building real agents. This isolates bugs.

**Why build this first:** everything else plugs into it. If routing is flaky, the rest of the demo will look broken even if individual agents are fine.

---

## 5. Build the Knowledge Base + Support Agent (Days 3–5)

1. Write 15–25 realistic support articles/FAQs as markdown files (shipping policy, returns, account issues, troubleshooting steps, pricing tiers, etc.) — treat this like real content, not filler, since RAG quality is judged on relevance, not just presence.
2. Chunk and embed them into ChromaDB (`chromadb` has a simple `add()`/`query()` API — no need for a custom pipeline).
3. Build the Support Agent node:
   - Takes the user query, embeds it, retrieves top-k chunks from Chroma
   - Passes retrieved context + query to the LLM with a system prompt instructing it to answer only from context, and to say "I don't have that information" if the context doesn't cover it (this avoids hallucination and is a good talking point for judges — "we prevent hallucinated support answers")
   - Emit a trace event for the retrieval step showing which KB articles were pulled — this is a great visible moment in the demo
4. Add a fallback: if the agent can't resolve after 2 exchanges, or detects frustration (simple keyword/sentiment check, or just ask the LLM "is this user frustrated? yes/no"), auto-route to the Scheduling agent to book a human callback.

---

## 6. Build the Sales Agent + Mock CRM (Days 5–7)

1. Set up Airtable: create a base with a Leads table — fields: name, email, product_interest, budget_range, use_case_notes, stage (New/Contacted/Qualified), created_at.
2. Write tools/crm.py with create_lead(), update_lead_stage(), get_lead() — each wraps Airtable's REST API via requests.
3. Register these as tools on the Sales Agent via LangGraph/LangChain's tool-calling — the LLM decides when to call them based on the conversation.
4. Agent flow, GrowMart-specific:
  - Greet → understand what the visitor is looking for (e.g., "wireless charger," "smart plug for home automation")
  - Ask qualifying questions relevant to a consumer purchase: device compatibility (phone model, case usage), budget range (₹500–1000 / ₹1000–2000 / ₹2000+), and use case (personal use, gift, bulk/office purchase — this is where "quantity" naturally replaces "team size" if someone is buying multiple units)
  - Recommend 1–2 products from your seeded catalog with a short rationale
  - If the visitor seems interested but isn't ready to buy immediately, call create_lead() with their info and interest
  - Draft a personalized follow-up email (e.g., "Hi Aditi, following up on the MagCharge 15W you were looking at — here's a quick comparison with our SmartPlug bundle if you're setting up a full charging station") — shown as an artifact in chat, not actually sent
5. Emit trace events for each tool call: "Sales Agent → checking product catalog" → "Sales Agent → creating lead in CRM..." → "✅ Lead created: Aditi Sharma — MagCharge 15W".



---

## 7. Build the Care Agent + Stripe Refund Flow (Days 7–9)

1. Set up Stripe test mode, create a few fake test "orders" (Stripe doesn't have built-in orders, so simulate this with a simple local JSON/SQLite table of `{order_id, amount, status}` mapped to Stripe test payment intent IDs).
2. Write `tools/refunds.py`: `lookup_order(order_id)`, `issue_refund(order_id)` (calls Stripe's refund API in test mode — real API call, fake money, completely safe).
3. Care Agent flow: user reports an issue → agent asks for order ID → looks it up → if eligible, confirms with user → calls `issue_refund()` → confirms completion.
4. Add a guardrail: refunds above a threshold (e.g., $500) get routed to a "needs human approval" state instead of auto-approving — this is a good responsible-AI talking point for judges.

---

## 8. Build the Scheduling Agent + Google Calendar (Days 9–10)

1. Set up Google Calendar API OAuth (use a service account or a simple OAuth flow with a test calendar — service account is faster for a hackathon since there's no login screen needed).
2. Write `tools/calendar.py`: `get_available_slots()`, `book_slot(datetime, user_email)`.
3. Scheduling Agent flow: triggered when another agent escalates, or when a user directly asks for a callback → shows 2–3 available slots → books on confirmation → creates a real calendar event.
4. This is a strong demo moment: show an actual Google Calendar event appear live.

---

## 9. Build the Frontend (Days 8–12, parallel to backend work above)

1. **Chat panel** (left/center): standard chat UI, message bubbles, streaming text response (stream tokens from the backend over WebSocket for a "typing" effect — this alone makes the demo feel more premium).
2. **Agent Trace panel** (right sidebar): this is your differentiator, invest real design time here.
   - Show a vertical timeline of events: agent name (color-coded), action taken, status icon (spinner → checkmark)
   - Example rendering: `🟢 Orchestrator → routed to Support Agent` → `🔵 Support Agent → searched knowledge base (3 articles found)` → `🔵 Support Agent → drafting response` → `✅ Resolved`
   - Use simple state updates driven by WebSocket messages; no need for a complex animation library, clean fade-ins are enough
3. **Dashboard page** (separate route): pull aggregate stats from your backend (number of conversations, resolution rate, average handling time, escalation rate, "estimated hours saved") — even mocked/simulated numbers over your test conversations are fine, just be honest in your writeup that this is a demo dataset.
4. Polish: consistent color palette per agent (e.g., sales = blue, support = green, care = purple, scheduling = orange), used consistently in both the chat and trace panel so judges instantly parse who's talking.

---

## 10. Integration Pass (Days 12–13)

1. Connect frontend to backend end-to-end. Test each agent path fully: sales conversation → support conversation → care/refund conversation → scheduling handoff.
2. Fix state persistence: make sure `user_id` is consistent across a session so agents can share context (e.g., support agent's frustration detection triggering the scheduling agent should carry over conversation history).
3. Add basic error handling: if an API call fails (Stripe/Airtable/Calendar down or misconfigured), the agent should gracefully say so instead of crashing the whole flow — write this defensively, it's a common demo-day failure point.
4. Deploy backend to Render/Railway, frontend to Vercel. Test the deployed version, not just localhost — deployed bugs (CORS, env vars, WebSocket over HTTPS/WSS) are common and need buffer time.

---

## 11. Polish & Demo Prep (Days 13–14)

1. Write 3 realistic demo scripts (one per major agent path) and rehearse them — judges respond far better to a smooth, rehearsed demo than an improvised one.
2. Record a 2–3 minute demo video as backup in case live demo/wifi fails during judging. Structure it as: 10s problem statement → 90s live walkthrough showing the trace panel → 20s architecture diagram → 20s impact/scalability pitch.
3. Prepare a one-page README with: problem statement, architecture diagram, tech stack, setup instructions, and a "what makes this different" section explicitly mapping features to the judging criteria (Innovation, Real-World Problem Solving, AI Automation, UX, Scalability).
4. Clean up the codebase: remove dead code, add comments, make sure `.env.example` is accurate, add a LICENSE if required.

---

## 12. Submission (Day 15, buffer before July 19 deadline)

1. Submit through the official FlowZint portal only: `https://flowzint.in/2026/ai/hackothon`.
2. Double check: submission category = **Open Innovation**, all links/demo/files are accessible (test in an incognito window), and only one final submission per team.
3. Confirm the demo video link and repo link both work from a fresh browser with no login.

---

## Key Risk Mitigations

| Risk | Mitigation |
|---|---|
| Agent framework learning curve eats time | Get orchestrator + one fake agent working end-to-end by Day 3 before adding complexity |
| Live API demo fails on judging day (wifi/rate limits) | Record a full backup demo video |
| Trace panel looks like a gimmick, not substance | Make sure trace events map to *real* tool calls (real Stripe/Airtable/Calendar calls), not fake delays |
| Scope creep (adding a 5th agent, extra channels) | Lock scope after Day 10 — polish beats more features |
| RAG gives wrong/hallucinated answers in front of judges | Constrain the support agent strictly to retrieved context, and test it live before demo day |
