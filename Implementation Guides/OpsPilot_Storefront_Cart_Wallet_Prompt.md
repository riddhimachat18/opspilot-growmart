# OpsPilot × GrowMart — Storefront UX, Cart/Wallet, and Differentiation Prompt

Use this as a direct brief for implementation. It covers your 5 requested changes plus a prioritized list of additions mapped to the judging criteria.

---

## 1. Contextual "Ask our agent" — auto-open + auto-send

**Behavior:** clicking "Not sure if this fits your setup? Ask our agent" on a product page should not just open the widget — it should open it *already having asked the question*, as if the user typed it.

**Implementation:**
- The widget component needs an imperative API, e.g. `openWithMessage(text: string)`, exposed via a ref or a lightweight global event bus (`window.dispatchEvent(new CustomEvent('opspilot:send', { detail: { message } }))`), since the trigger button lives on a different page-level component than the widget.
- On click: expand the widget (collapsed → expanded state), then immediately call the same `sendMessage()` path the input box uses — with the product name and price interpolated in, e.g.:
  > "I'm looking at the MagCharge 15W Wireless Charger (₹1,499) — does this work well with a phone case on?"
- Show this as a normal user-bubble message (it *is* what the user is asking, just pre-filled) — don't disguise it as a system message. This also means it goes through the exact same orchestrator → sales_agent path as manual typing, so no special-casing needed server-side.
- Small but important: disable the input box briefly (or show a sending indicator) during the auto-send so it doesn't feel like a glitch if the response takes a second.

---

## 2. Resizable, lighter widget

**Resizing:**
- Add a drag handle on the top-left corner of the expanded widget panel (a small diagonal-lines grip icon, standard convention). Track `width`/`height` in component state, clamp to sensible min/max (e.g. min 340×420, max ~600×800 or viewport-constrained), persist the user's chosen size in React state for the session (not localStorage — see your artifact constraints).
- Simplest implementation: a `react-rnd` or `react-resizable` package if you're in a plain React/Vite setup (not the Claude-artifact sandbox), or a manual `mousedown`/`mousemove`/`mouseup` handler pair if you want zero new dependencies — for a hackathon, the manual version is honestly fewer moving parts to debug.

**Palette shift (dark → warm/light):**
This matters more than it sounds — right now the widget looks like a dev tool, not a customer-facing chat. New direction:
- Background: warm off-white (`#FFFBF7` or similar), not stark white — softer, more "boutique storefront."
- Bubbles: customer messages in GrowMart's accent color (soft coral/amber, e.g. `#FF8A5C`) on white text; agent messages in a light neutral card (`#F4F1EC`) with dark text.
- Keep the trace panel visually distinct but not dark-mode-harsh — a *cooler* light gray (`#EEF0F3`) with the monospace log lines, so it still reads as "the technical layer" without clashing with the warm chat side. This preserves your "widget wears the client's branding, trace panel stays technical" narrative from before, just less stark.
- Rounded-xl corners throughout (softer than the admin console's rounded-lg), subtle drop shadow instead of the thin-border enterprise look — this is the one surface that should feel approachable rather than command-center.

---

## 3. Top-right account menu + default test profile

**Menu bar (top-right of the GrowMart storefront, not the widget):**
- Avatar/initial button → dropdown with: Profile name (test account), Cart (badge with item count), Wishlist, Orders, Chat history, Open tickets, Sign out (can be a no-op for demo purposes).

**Default test profile — seed this as static demo data:**
```
Name: Aditi Sharma
Email: aditi@example.com
Cart: [] (starts empty, populated live per change #4)
Wishlist: 1-2 pre-seeded products
Orders: reuse 2-3 of your existing seeded orders (including GM-10234) so "Orders" isn't empty on first load
Chat history: link to /admin/tickets filtered by this user, or a simple read-only transcript list
Open tickets: any order above the ₹1500 refund threshold that's pending human review (ties directly into change #5)
```
This profile should be the *same* identity used as `user_id` in your WebSocket calls — so long-term memory (from your existing Store setup) actually has continuity to draw on, and "Orders" tab data lines up with what the Care Agent can look up.

**Design:** keep this consistent with the storefront's light palette — a simple dropdown card, not a full page, so it doesn't interrupt the shopping flow.

---

## 4. Cart persistence + redirect on confirmed add-to-cart

**The flow to get right:** user says "yes" to a product recommendation → agent asks "want me to add it to your cart?" → user says "yes" → item actually lands in cart state → widget minimizes/closes and the app navigates to `/growmart/cart`.

**This needs a real tool, not just conversational text.** Right now `sales_agent.py` only has `check_product_catalog` and `create_crm_lead` — there's no `add_to_cart` tool, so the LLM saying "I've added it to your cart!" is currently just words with no effect. Add:

```python
@tool
def add_to_cart(product_name: str, quantity: int = 1) -> str:
    """
    Add a product to the customer's cart. Only call this after the customer
    has explicitly confirmed they want it added — never call this just
    because they expressed interest.

    Args:
        product_name: Exact product name from the catalog.
        quantity: Number of units (default 1).
    """
    ...
```

- Backend-side, this needs somewhere real to write to — simplest for a hackathon: a small per-user cart store (could literally reuse your LangGraph `Store` — namespace `(user_id, "cart")` — so it's already wired into your existing long-term memory infra rather than a new table).
- The tool call itself should emit a trace event (`"action": "add_to_cart", "status": "done"`) — another great visible trace-panel moment.
- **Frontend redirect:** the WebSocket needs to signal this distinctly from a normal token/trace event — add a new event type:
  ```json
  { "type": "action", "action": "cart_updated", "product": "...", "redirect": "/growmart/cart" }
  ```
  emitted from `main.py` when it sees an `add_to_cart` tool call completed in the trace log for this turn. Frontend listens for `type === "action"`, updates cart state (or just refetches it), minimizes the widget, and navigates. This is the one piece of "the AI actually did something" that needs to be *visually undeniable* — don't leave it as only a trace log line judges have to read carefully.

---

## 5. Wallet + tiered refund flow with more follow-ups

**Wallet:**
- Add a `/growmart` wallet balance visible in the top menu (e.g. "₹2,450") — seed each test profile with a starting balance (e.g. ₹5,000) purely for demo visualization. This doesn't need to be "real" money logic, just a number that changes when a refund posts, so judges can *see* the refund land somewhere concrete instead of just reading a chat confirmation.
- On successful `issue_order_refund`, increment the wallet balance and emit an `"action"` event (same mechanism as cart) so the frontend can show a little balance-increase animation/toast — this is a strong, cheap "wow" moment for very little engineering.

**Refund threshold — you already have this at ₹3500 in `care_agent.py`; you're now asking to lower it to ₹1500 and add more follow-up questions first.** Two changes to `care_agent.py`:

1. Change the constant:
   ```python
   REFUND_APPROVAL_THRESHOLD = 1500  # was 3500
   ```
   (in `tools/refunds.py`, propagates automatically since `care_agent.py` imports it)

2. Add follow-up depth before eligibility is even checked — right now the agent can jump from "what's your order ID" straight to auto-refund. Add explicit steps to the system prompt:
   ```
   Before checking refund eligibility, always ask 1-2 follow-up questions to
   understand the issue properly:
   - What's wrong with the item (defective, wrong item, damaged in transit, no longer needed)?
   - Have they already tried any troubleshooting (for defective claims) — if this
     sounds like a fixable technical issue rather than a genuine refund case,
     suggest checking with Support first before proceeding with a refund.
   Only proceed to check_refund_eligibility once you understand the actual reason —
   don't refund on Order ID alone.
   ```
   This also makes the demo read as a real conversation instead of "say order ID, get money" — more convincing as "AI automation" rather than a lookup script.

3. For above-threshold refunds, make the "ticket for human review" tangible: it should actually create a row visible in `/admin/tickets` (which you already speced) — so the live demo can show: customer asks for a ₹2000 refund → care_agent explains it needs approval → judges flip to `/admin/tickets` → see it sitting there pending → click "Approve" → wallet updates. That end-to-end loop is your single best demo moment across the whole build.

---

## What else to add, mapped to judging criteria

**Innovation & Creativity**
- The GrowMart-branded-widget-over-OpsPilot-branded-trace-panel visual contrast (already planned) — lead with this in your pitch, it's a genuinely distinctive detail most teams won't think to call out explicitly.
- Long-term memory payoff: script a *second* demo session under the same test profile days apart (or just re-open the chat) where the agent opens with "Hi again — following up on the SmartPlug issue from before?" — you already have the Store wired for this per your memory guide, just make sure at least one scripted demo moment uses it.

**Real-World Problem Solving**
- The tiered refund guardrail + human-review ticket queue is your strongest "real business" artifact — most hackathon bots don't model approval workflows at all. Make sure your README explicitly calls out *why* ₹1500 (e.g. "roughly GrowMart's average order value — small refunds are low-risk to automate, larger ones warrant a human look").

**AI Automation**
- Consider one more genuinely automated action beyond refunds/leads/bookings: an **auto-generated order-issue summary** attached to every escalated ticket (a one-line LLM-written summary of "what happened" shown in `/admin/tickets`, so the human reviewer doesn't have to read the full transcript to act). Cheap to build (one extra LLM call at escalation time), and it's a second concrete "automation," not just chat.

**User Experience**
- A subtle "agent is thinking" indicator distinct from token streaming (a pulsing dot before the first token arrives) — right now there may be a dead gap between sending a message and the first token; even 300ms of "spinner" closes that gap perceptually.
- Empty states matter more than people think: make sure Cart/Wishlist/Orders don't look broken before any demo interaction — you're already handling this by seeding the test profile.

**Scalability & Functionality**
- Multi-tenant framing: explicitly note in your README/demo that the widget takes a `brand_config` (colors, name, greeting) as a prop — even if GrowMart is your only real skin, showing the widget *could* re-skin for another brand with a config object (not a code fork) is a strong scalability claim, and it's a small refactor if your palette work above is done with CSS variables/theme tokens rather than hardcoded colors.
- Mention rate-limiting/cost controls briefly (e.g. "classifier calls are cheap/fast-tier, generation calls use a stronger model only when needed") if true of your model choices — judges evaluating scalability like seeing cost-awareness, not just "it works."

---

## Suggested build order for this batch

1. `add_to_cart` tool + cart Store + `action` WebSocket event (change #4) — highest demo payoff, touches the most infrastructure, do it first while you have the most runway
2. Refund threshold + follow-up prompt changes (change #5, care_agent/refunds.py) — small, low-risk, do early
3. Wallet balance + refund `action` event — piggybacks on #1's plumbing
4. Widget palette + resize (change #2) — pure frontend, can be done in parallel by whoever isn't on the backend cart work
5. Top-right menu + test profile (change #3) — mostly static/seed data, good "polish day" task
6. Contextual auto-send (change #1) — small, do once the widget's imperative API exists from #4's work anyway
7. Ticket auto-summary + long-term-memory demo script — save for polish days, these are narrative/demo-script investments more than engineering
