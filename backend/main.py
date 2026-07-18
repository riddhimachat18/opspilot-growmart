"""
backend/main.py — FastAPI server exposing a WebSocket endpoint that streams
both token-level LLM output (for the chat bubble) and node/tool-level trace
events (for the Agent Trace Panel) from the compiled graph.

Run with:
    uvicorn backend.main:app --reload --port 8000

Frontend connects to: ws://localhost:8000/ws/chat  (wss:// once deployed)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
from langchain_core.messages import HumanMessage

from backend.graph import app_graph
import backend.tools.db as db

app = FastAPI(title="OpsPilot Backend")

# Loosen this to your actual deployed frontend origin before submission —
# "*" is fine for local dev, not for production.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:4173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Node names that should generate visible trace events in the panel.
# Internal LangGraph plumbing (routing functions etc.) is filtered out.
AGENT_NODE_NAMES = {
    "orchestrator",
    "sales_agent",
    "support_agent",
    "care_agent",
    "scheduling_agent",
}

# Node names whose LLM output should stream to the chat bubble.
# Excludes "orchestrator" deliberately — its classifier_model.invoke() call
# also fires on_chat_model_stream events, but that's an internal structured
# classification request, not user-facing chat text, and Gemini streams
# structured/tool output as a list of content parts rather than plain
# strings — forwarding it as-is crashes the client and leaks raw JSON.
STREAMING_NODE_NAMES = {
    "sales_agent",
    "support_agent",
    "care_agent",
    "scheduling_agent",
}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.on_event("startup")
async def keep_alive():
    """Ping /health every 10 minutes to prevent Render free tier sleep."""
    import asyncio, httpx, os
    async def _ping():
        # Only run on Render (not locally)
        if not os.getenv("RENDER"):
            return
        await asyncio.sleep(60)  # wait for full startup first
        host = os.getenv("RENDER_EXTERNAL_URL", "")
        if not host:
            return
        async with httpx.AsyncClient() as client:
            while True:
                try:
                    await client.get(f"{host}/health", timeout=10)
                except Exception:
                    pass
                await asyncio.sleep(600)  # 10 minutes
    asyncio.create_task(_ping())


# ── REST API ─────────────────────────────────────────────────────────────────
# All routes use user_id = "user-aditi" for the demo.
# In production, read user_id from a session/JWT.

USER_ID = "user-aditi"


@app.get("/api/user")
async def get_user():
    user = db.get_user(USER_ID)
    return user or {}


@app.get("/api/orders")
async def get_orders():
    return db.get_orders(USER_ID)


@app.get("/api/cart")
async def get_cart():
    return db.get_cart(USER_ID)


class CartItemBody(BaseModel):
    product_id: str
    quantity:   int = 1


@app.post("/api/cart")
async def add_to_cart(body: CartItemBody):
    db.upsert_cart_item(USER_ID, body.product_id, body.quantity)
    return {"ok": True}


class CartQtyBody(BaseModel):
    quantity: int


@app.put("/api/cart/{product_id}")
async def update_cart(product_id: str, body: CartQtyBody):
    db.update_cart_qty(USER_ID, product_id, body.quantity)
    return {"ok": True}


@app.delete("/api/cart/{product_id}")
async def delete_cart_item(product_id: str):
    db.remove_cart_item(USER_ID, product_id)
    return {"ok": True}


@app.delete("/api/cart")
async def clear_cart():
    db.clear_cart(USER_ID)
    return {"ok": True}


@app.get("/api/wishlist")
async def get_wishlist():
    return db.get_wishlist(USER_ID)


@app.get("/api/wallet")
async def get_wallet():
    user = db.get_user(USER_ID)
    return {"balance": user["wallet"] if user else 0, "transactions": db.get_wallet_transactions(USER_ID)}


@app.get("/api/tickets")
async def get_tickets():
    return db.get_tickets(USER_ID)


@app.get("/api/admin/tickets")
async def get_all_tickets():
    return db.get_all_tickets()


class ResolveTicketBody(BaseModel):
    action: str = "approved"


@app.post("/api/admin/tickets/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str, body: ResolveTicketBody):
    db.resolve_ticket(ticket_id, body.action)
    # If approved refund, credit the wallet
    tickets = db.get_all_tickets()
    ticket  = next((t for t in tickets if t["id"] == ticket_id), None)
    if ticket and body.action == "approved" and ticket.get("amount"):
        new_bal = db.credit_wallet(USER_ID, ticket["amount"], f"Refund approved for {ticket.get('order_id','')}")
        return {"ok": True, "wallet": new_bal}
    return {"ok": True}


@app.get("/api/chat-history")
async def get_chat_history():
    return db.get_chat_history(USER_ID)


class PlaceOrderBody(BaseModel):
    product: str
    amount:  float


@app.post("/api/orders")
async def place_order(body: PlaceOrderBody):
    order_id = db.place_order(USER_ID, body.product, body.amount)
    db.clear_cart(USER_ID)
    db.debit_wallet(USER_ID, body.amount, f"Order {order_id}")
    return {"order_id": order_id}


@app.get("/api/leads")
async def get_leads():
    """Proxy Airtable leads for the admin CRM view."""
    import os, requests as r
    key    = os.getenv("AIRTABLE_API_KEY")
    base   = os.getenv("AIRTABLE_BASE_ID")
    table  = os.getenv("AIRTABLE_TABLE_NAME", "Leads")
    url    = f"https://api.airtable.com/v0/{base}/{table}"
    headers = {"Authorization": f"Bearer {key}"}
    resp   = r.get(url, headers=headers, timeout=10)
    if resp.status_code != 200:
        return []
    records = resp.json().get("records", [])
    return [{"id": rec["id"], **rec.get("fields", {})} for rec in records]


@app.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()

    # Tracks how many trace_log entries have already been sent, PER SESSION,
    # across all turns in this connection — not reset per message. This
    # matters because trace_log persists via the checkpointer across turns
    # (same thread_id), so a later turn's full_trace_log includes every
    # prior turn's events too. Resetting this per-message would resend
    # the entire conversation's trace history on every new message.
    sent_trace_counts: dict[str, int] = {}

    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            session_id = data.get("session_id", "default-session")
            user_id = data.get("user_id", "anonymous")

            if not user_message.strip():
                await websocket.send_json({"type": "error", "detail": "Empty message."})
                continue

            config = {
                "configurable": {
                    "thread_id": session_id,   # short-term memory: conversation continuity
                    "user_id": user_id,        # long-term memory: cross-session facts
                }
            }
            input_state = {"messages": [HumanMessage(content=user_message)]}

            sent_trace_count = sent_trace_counts.get(session_id, 0)
            any_tokens_sent = False
            final_output = {}

            try:
                async for event in app_graph.astream_events(input_state, config=config, version="v2"):
                    kind = event["event"]
                    name = event.get("name", "")

                    # --- Token-level streaming for the chat bubble --------
                    # Gate on langgraph_node metadata — but fall back to
                    # checking the run name prefix so tokens aren't silently
                    # dropped when metadata keys vary across langchain versions.
                    if kind == "on_chat_model_stream":
                        node_name = (
                            event.get("metadata", {}).get("langgraph_node")
                            or event.get("metadata", {}).get("ls_metadata", {}).get("langgraph_node")
                            or ""
                        )
                        # If we can't resolve the node name from metadata,
                        # allow through only when there's exactly one agent
                        # active — this is the common case and safe to stream.
                        should_stream = (
                            node_name in STREAMING_NODE_NAMES
                            or (not node_name and name not in ("orchestrator",))
                        )
                        if should_stream:
                            chunk = event["data"]["chunk"]
                            content = chunk.content
                            if isinstance(content, str) and content:
                                any_tokens_sent = True
                                await websocket.send_json({
                                    "type": "token",
                                    "content": content,
                                })
                            elif isinstance(content, list):
                                text_parts = [
                                    part.get("text", "") for part in content
                                    if isinstance(part, dict) and part.get("type") == "text"
                                ]
                                joined = "".join(text_parts)
                                if joined:
                                    any_tokens_sent = True
                                    await websocket.send_json({
                                        "type": "token",
                                        "content": joined,
                                    })

                    # --- Node-level trace events for the trace panel ------
                    elif kind == "on_chain_start" and name in AGENT_NODE_NAMES:
                        await websocket.send_json({
                            "type": "trace",
                            "agent": name,
                            "status": "started",
                        })

                    elif kind == "on_chain_end" and name in AGENT_NODE_NAMES:
                        output = event["data"].get("output") or {}
                        final_output = output  # keep the most recent node's output for fallback below
                        full_trace_log = output.get("trace_log", [])

                        # Only forward entries that haven't been sent yet.
                        new_events = full_trace_log[sent_trace_count:]
                        sent_trace_count = len(full_trace_log)

                        for trace_event in new_events:
                            # user_notice → transient status toast (not a chat bubble)
                            if trace_event.get("user_notice"):
                                await websocket.send_json({
                                    "type":    "status",
                                    "message": trace_event["user_notice"],
                                })

                            # cart_signal → write to Supabase + tell frontend to navigate
                            if trace_event.get("cart_signal"):
                                signal = trace_event["cart_signal"]  # "CART_ADD::slug-id::qty"
                                try:
                                    _, product_id, qty = signal.split("::")
                                    qty_int = int(qty)
                                    # Write directly to Supabase — slug is already correct
                                    db.upsert_cart_item(USER_ID, product_id, qty_int)
                                    await websocket.send_json({
                                        "type":       "action",
                                        "action":     "cart_updated",
                                        "product_id": product_id,
                                        "quantity":   qty_int,
                                        "redirect":   "/growmart/cart",
                                    })
                                except Exception:
                                    pass

                            # refund_signal → frontend credits wallet
                            if trace_event.get("refund_signal") is not None:
                                await websocket.send_json({
                                    "type":   "action",
                                    "action": "refund_issued",
                                    "amount": trace_event["refund_signal"],
                                })

                            await websocket.send_json({
                                "type": "trace",
                                **trace_event,
                            })
                        await websocket.send_json({
                            "type": "trace",
                            "agent": name,
                            "status": "done",
                        })

                # Fallback: if no tokens were streamed this whole turn (e.g.
                # the orchestrator's "unclear" clarifying question, or an
                # agent's early-return escalation message — both attach an
                # AIMessage directly to state instead of going through
                # on_chat_model_stream), send the final node's message
                # content as individual character chunks so the frontend
                # streaming bubble is created, filled, and then closed
                # correctly via message_complete — never in the same
                # microtask batch that would leave isStreaming stuck.
                if not any_tokens_sent:
                    final_messages = final_output.get("messages", [])
                    for msg in final_messages:
                        msg_content = getattr(msg, "content", None)
                        if isinstance(msg_content, str) and msg_content:
                            # Send as a single token (no character splitting needed —
                            # the bubble just needs to exist before message_complete).
                            await websocket.send_json({
                                "type": "token",
                                "content": msg_content,
                            })
                            # Yield to the event loop so the token frame is
                            # flushed to the client before message_complete
                            # arrives — prevents React from batching both state
                            # updates and leaving isStreaming stuck as True.
                            import asyncio
                            await asyncio.sleep(0)

                await websocket.send_json({"type": "message_complete"})
                sent_trace_counts[session_id] = sent_trace_count

                # ── Persist chat history to Supabase ─────────────────────
                # Determine which agent handled this turn and what happened
                try:
                    full_trace = final_output.get("trace_log", [])
                    current_agent = final_output.get("current_agent", "orchestrator")

                    # Infer outcome from trace events
                    outcome = "Resolved"
                    for ev in full_trace:
                        action = ev.get("action", "")
                        if action == "issue_refund" and ev.get("status") == "done":
                            outcome = "Refunded"
                            break
                        if action in ("escalate", "create_ticket"):
                            outcome = "Escalated"
                            break
                        if action == "create_lead" and ev.get("status") == "done":
                            outcome = "Lead created"
                            break
                        if action == "book_slot" and ev.get("status") == "done":
                            outcome = "Booked"
                            break

                    # Build a one-line summary from the user's message
                    summary = user_message[:120] if user_message else "Conversation"

                    safe_user_id = user_id if user_id and user_id != "anonymous" else USER_ID
                    db.add_chat_history(
                        user_id=safe_user_id,
                        summary=summary,
                        agent=current_agent,
                        outcome=outcome,
                        preview="",
                    )
                except Exception:
                    pass  # never let history-saving break the response flow

            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "detail": f"Something went wrong processing that: {str(e)}",
                })

    except WebSocketDisconnect:
        pass