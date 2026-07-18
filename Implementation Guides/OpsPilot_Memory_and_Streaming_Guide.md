# OpsPilot — Memory, Persistence & Streaming Implementation Guide

LangGraph has built-in support for both of these — you don't need to hand-roll them. This guide covers the two separate memory concepts you need and how to wire streaming into your WebSocket trace panel.

---

## Part 1: Memory — Two Different Kinds You Need

It's worth separating these clearly, because they solve different problems and use different LangGraph features:

| Type | What it is | LangGraph feature | Example |
|---|---|---|---|
| **Short-term (conversation) memory** | Remembers the current conversation's message history and state across turns | **Checkpointer** | User says "it's still not working" and the agent knows what "it" refers to |
| **Long-term (cross-session) memory** | Remembers facts about a user across *different* conversations, even days apart | **Store** | User returns next week; agent already knows their past order and that they were frustrated last time |

Both are needed for a genuinely impressive demo — short-term memory alone just gives you a normal chatbot; long-term memory is what lets you say "our agent remembers returning customers," which is a strong differentiator in your pitch.

---

### 1.1 Short-Term Memory: Checkpointer Setup

The checkpointer automatically saves your graph's state after every step, keyed by a `thread_id`. Resuming a conversation is just re-invoking the graph with the same `thread_id`.

```python
# backend/graph.py
from langgraph.graph import StateGraph
from langgraph.checkpoint.sqlite import SqliteSaver
# For production/deployment use SqliteSaver or PostgresSaver, not MemorySaver
# (MemorySaver wipes on server restart — fine for local dev only)

checkpointer = SqliteSaver.from_conn_string("opspilot_checkpoints.db")

graph = StateGraph(AgentState)
# ... add your nodes and edges as already planned ...

app_graph = graph.compile(checkpointer=checkpointer)
```

**Invoking with persistence** — the `thread_id` is the critical piece. Use one per conversation/session:

```python
config = {"configurable": {"thread_id": user_session_id}}

result = app_graph.invoke(
    {"messages": [{"role": "user", "content": user_message}]},
    config=config
)
```

Every subsequent call with the same `thread_id` automatically has access to the full prior message history and any other state fields (`current_agent`, `trace_log`, etc.) — you don't need to manually pass conversation history back in.

**Frontend responsibility:** generate a `session_id` (UUID) when a chat starts, store it in state (or `sessionStorage` is fine here since it's just an ID, not sensitive data — but per your artifact constraints, if this were inside a Claude artifact you'd keep it in React state instead), and send it with every WebSocket message so the backend knows which thread to resume.

---

### 1.2 Long-Term Memory: Store Setup

This is what lets the agent recall facts about a user *across* sessions — e.g., "this user had a refund escalation last month" or "this user prefers WhatsApp over email."

```python
# backend/graph.py
from langgraph.store.sqlite import SqliteStore
# InMemoryStore exists for local dev, but use a persistent store for anything
# you want to survive a restart or demo across multiple days

store = SqliteStore.from_conn_string("opspilot_longterm_memory.db")

app_graph = graph.compile(checkpointer=checkpointer, store=store)
```

**Namespacing memories per user** — use a tuple namespace, typically `(user_id, "memories")`:

```python
# Writing a memory (e.g., after a support interaction resolves)
store.put(
    namespace=(user_id, "memories"),
    key="last_issue",
    value={"summary": "WiFi connection issue with SmartPlug, resolved via reset steps", "date": "2026-07-10"}
)

# Reading memories back at the start of a new conversation
memories = store.search(namespace=(user_id, "memories"))
```

**Wiring this into your agent nodes:** at the start of any agent node, pull relevant memories and inject them into the system prompt as context:

```python
def support_agent_node(state, config, *, store):
    user_id = config["configurable"]["user_id"]
    past_memories = store.search((user_id, "memories"), limit=3)
    memory_context = "\n".join(m.value["summary"] for m in past_memories)

    system_prompt = f"""You are GrowMart's support agent.
    Known history with this user: {memory_context or "No prior interactions."}
    ..."""
    # continue with LLM call as normal
```

At the end of a resolved conversation, write a short summary back into the store — you can do this with a small dedicated LLM call ("summarize this resolution in one sentence") rather than storing the raw transcript, which keeps memory lean and reusable.

**Demo payoff:** script one of your live demo conversations to intentionally reuse a `user_id` from an earlier seeded interaction, so judges see the agent open with something like *"Hi again — I see you had a WiFi issue with your SmartPlug last time, is this related?"* This single moment does more to prove "memory" than any architecture slide.

---

## Part 2: Streaming with LangGraph

You want two things streamed to your trace panel simultaneously: **token-level LLM output** (for the chat bubble typing effect) and **node/step-level updates** (for the trace panel timeline). LangGraph's `astream_events` (v2 API) gives you both from a single stream.

### 2.1 Backend: Streaming Endpoint

```python
# backend/main.py
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        user_message = data["message"]
        session_id = data["session_id"]
        user_id = data["user_id"]

        config = {
            "configurable": {"thread_id": session_id, "user_id": user_id}
        }
        input_state = {"messages": [{"role": "user", "content": user_message}]}

        async for event in app_graph.astream_events(input_state, config=config, version="v2"):
            kind = event["event"]

            # Token-level streaming for the chat bubble
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    await websocket.send_json({
                        "type": "token",
                        "content": chunk.content
                    })

            # Node-level updates for the trace panel
            elif kind == "on_chain_start" and event["name"] in AGENT_NODE_NAMES:
                await websocket.send_json({
                    "type": "trace",
                    "agent": event["name"],
                    "status": "started"
                })

            elif kind == "on_chain_end" and event["name"] in AGENT_NODE_NAMES:
                await websocket.send_json({
                    "type": "trace",
                    "agent": event["name"],
                    "status": "done"
                })

            # Tool call events — these are your best trace panel moments
            elif kind == "on_tool_start":
                await websocket.send_json({
                    "type": "trace",
                    "tool": event["name"],
                    "input": event["data"].get("input"),
                    "status": "calling"
                })

            elif kind == "on_tool_end":
                await websocket.send_json({
                    "type": "trace",
                    "tool": event["name"],
                    "output": str(event["data"].get("output"))[:200],
                    "status": "done"
                })

        await websocket.send_json({"type": "message_complete"})
```

`AGENT_NODE_NAMES` should be a set of your node names (`"sales_agent"`, `"support_agent"`, etc.) so you only emit trace events for meaningful steps, not internal LangGraph plumbing.

### 2.2 Frontend: Consuming the Stream

```javascript
// frontend/src/hooks/useChatSocket.js
const ws = new WebSocket("wss://your-backend-url/ws/chat");

let currentMessageBuffer = "";

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "token") {
    currentMessageBuffer += data.content;
    updateChatBubble(currentMessageBuffer); // append to the last assistant message, triggers typing effect
  }

  if (data.type === "trace") {
    addTraceEvent(data); // push into the trace panel timeline, triggers fade-in animation
  }

  if (data.type === "message_complete") {
    finalizeMessage(currentMessageBuffer);
    currentMessageBuffer = "";
  }
};

function sendMessage(text, sessionId, userId) {
  ws.send(JSON.stringify({ message: text, session_id: sessionId, user_id: userId }));
}
```

Keep the trace panel and chat bubble updates as **separate state updates** in React (e.g., separate `useState` for `messages` vs `traceEvents`) so re-renders stay cheap even with frequent token streaming.

---

## Part 3: Practical Notes for Your Timeline

- **Build order:** get the checkpointer working first (Day 3, alongside the orchestrator) — it's a small addition once your graph exists and unblocks realistic multi-turn testing immediately. Add the long-term Store later (Day 9–10) once individual agents are stable; it's a nice-to-have layered on top, not a blocker.
- **SqliteSaver/SqliteStore vs Postgres:** SQLite is fine for a hackathon demo — zero setup, file-based, works on Render/Railway's free tier as long as you're not doing high concurrent write loads. Don't over-engineer this with Postgres unless your team already knows it well.
- **Don't stream everything:** only emit `on_tool_start`/`on_tool_end` for your actual business tools (CRM, refunds, calendar, KB search) — filter out LangGraph's internal retrieval/formatting steps or your trace panel will be noisy instead of impressive.
- **Test streaming over the deployed URL, not just localhost** — WebSockets need `wss://` (not `ws://`) once deployed behind HTTPS, and some free-tier hosts have quirks with long-lived WebSocket connections. Verify this by Day 12, not Day 14.
