"""
backend/agents/orchestrator.py

Two responsibilities:
  1. Rolling summarization — when the message list exceeds SUMMARIZE_THRESHOLD,
     fold the oldest (len - KEEP_RECENT) messages into conversation_summary
     and emit RemoveMessage deletions so state stays bounded.
     This is correct: LangGraph's add_messages reducer honours RemoveMessage
     objects, so returning them from a node physically removes those messages
     from persisted state.

  2. Intent classification — classify the latest user intent using
     conversation_summary (all trimmed history) + the remaining recent
     messages, so even a bare "GM-10234" reply is understood in context.

The orchestrator never streams chat text to the user — it emits a "status"
trace event when summarizing (surfaced by main.py as a transient toast, not
a chat bubble) and a "classify" trace event for the routing decision.

Graph structure lives entirely in graph.py. Do not add StateGraph calls here.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, RemoveMessage
from dotenv import load_dotenv

from backend.state import AgentState, MessageSchema

load_dotenv()

MODEL_NAME = "gemini-3.1-flash-lite"

# ── Summarization thresholds ───────────────────────────────────────────────
# Tune these for your demo. At 16 messages (8 user + 8 assistant) a hackathon
# conversation is getting long; keeping 8 recent gives the agents enough
# immediate context while bounding the context window.
SUMMARIZE_THRESHOLD = 16   # trigger summarization when len(messages) > this
KEEP_RECENT         = 8    # how many most-recent messages to keep verbatim

# ── Models ──────────────────────────────────────────────────────────────────
_base_model      = ChatGoogleGenerativeAI(model=MODEL_NAME)
classifier_model = _base_model.with_structured_output(MessageSchema)
# Separate plain model for summarization — no structured output needed
summarizer_model = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.2)

# ── Prompts ─────────────────────────────────────────────────────────────────
CLASSIFIER_SYSTEM = (
    "You are the GrowMart Orchestrator. Classify the customer's latest intent:\n"
    "- sales: Intent to buy, product inquiries, device compatibility, pricing.\n"
    "- support: Hardware troubleshooting, order tracking, account/shipping questions.\n"
    "- care: Product damage, complaints, refund or return requests.\n"
    "- scheduling: Booking a callback or meeting for escalated issues or bulk orders.\n"
    "- unclear: Completely off-topic, nonsensical, or truly ambiguous.\n\n"
    "Use the conversation summary and recent messages below to understand context. "
    "A bare order ID like 'GM-10234' in the context of a prior refund discussion "
    "is 'care', not 'support'."
)

SUMMARIZER_SYSTEM = (
    "You are summarizing a customer support conversation for GrowMart. "
    "Produce a concise factual summary (3-6 sentences) covering: "
    "what the customer wanted, what was discovered or confirmed, "
    "what actions were taken (refunds, bookings, recommendations), "
    "and any unresolved items. Be specific — include order IDs, amounts, "
    "product names, and outcomes where present. Do not add opinions or filler."
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _format_messages_for_summary(messages) -> str:
    """Render a list of LangChain messages as a plain conversation transcript."""
    lines = []
    for m in messages:
        role = getattr(m, "type", "unknown")
        content = getattr(m, "content", "")
        if isinstance(content, list):
            # Tool-call or multi-part content — flatten to text
            content = " ".join(
                p.get("text", "") for p in content
                if isinstance(p, dict) and p.get("type") == "text"
            )
        label = {"human": "Customer", "ai": "Agent", "tool": "Tool"}.get(role, role.title())
        if content and content.strip():
            lines.append(f"{label}: {content.strip()}")
    return "\n".join(lines)


def _summarize(existing_summary: str, messages_to_fold) -> str:
    """
    Produce an updated rolling summary by summarizing messages_to_fold
    and appending to (or replacing) the existing summary.
    Safe to call even if messages_to_fold is empty — returns existing_summary.
    """
    if not messages_to_fold:
        return existing_summary

    transcript = _format_messages_for_summary(messages_to_fold)
    if not transcript.strip():
        return existing_summary

    prompt_parts = []
    if existing_summary:
        prompt_parts.append(f"Previous summary:\n{existing_summary}\n")
    prompt_parts.append(f"New conversation to incorporate:\n{transcript}")

    prompt = "\n".join(prompt_parts)

    response = summarizer_model.invoke([
        SystemMessage(content=SUMMARIZER_SYSTEM),
        HumanMessage(content=prompt),
    ])

    content = response.content
    if isinstance(content, list):
        content = " ".join(
            p.get("text", "") for p in content
            if isinstance(p, dict) and p.get("type") == "text"
        )
    return str(content).strip()


# ── Node ─────────────────────────────────────────────────────────────────────

def orchestrator_node(state: AgentState, config: dict = None, *, store=None) -> dict:
    """
    LangGraph node: optionally summarizes old messages, then classifies
    the user's current intent. Returns routing label in message_type.
    """
    messages        = state["messages"]
    existing_summary = state.get("conversation_summary", "")
    trace_events    = []
    messages_to_remove = []
    new_summary     = existing_summary

    # ── Step 1: rolling summarization ──────────────────────────────────────
    if len(messages) > SUMMARIZE_THRESHOLD:
        n_to_trim        = len(messages) - KEEP_RECENT
        messages_to_fold = messages[:n_to_trim]
        recent_messages  = messages[n_to_trim:]

        # Emit a status trace event — main.py surfaces this as a toast,
        # NOT a chat bubble, so it never pollutes conversation history.
        trace_events.append({
            "agent":       "orchestrator",
            "action":      "summarize",
            "status":      "started",
            "user_notice": "Summarising context, please wait…",
            "detail":      f"Folding {n_to_trim} messages into summary",
        })

        new_summary = _summarize(existing_summary, messages_to_fold)

        # RemoveMessage objects tell add_messages to physically delete these
        # messages from persisted state. This is the only correct way to
        # trim LangGraph's append-only message list.
        messages_to_remove = [RemoveMessage(id=m.id) for m in messages_to_fold]

        trace_events.append({
            "agent":  "orchestrator",
            "action": "summarize",
            "status": "done",
            "detail": f"Summary updated ({len(new_summary)} chars)",
        })
    else:
        recent_messages = messages

    # ── Step 2: classification ──────────────────────────────────────────────
    # Build classifier context: summary (if any) + recent messages
    classifier_messages = []

    system_content = CLASSIFIER_SYSTEM
    if new_summary:
        system_content += f"\n\nConversation summary so far:\n{new_summary}"

    classifier_messages.append(SystemMessage(content=system_content))

    # Add up to KEEP_RECENT most-recent messages for in-context turns
    for m in recent_messages[-KEEP_RECENT:]:
        classifier_messages.append(m)

    result = classifier_model.invoke(classifier_messages)

    trace_events.append({
        "agent":  "orchestrator",
        "action": "classify",
        "result": result.message_type,
        "detail": f"→ {result.message_type}",
    })

    # ── Step 3: build return dict ───────────────────────────────────────────
    response_update: dict = {
        "message_type":             result.message_type,
        "current_agent":            "orchestrator",
        "awaiting_agent_response":  False,
        "conversation_summary":     new_summary,
        "trace_log":                state.get("trace_log", []) + trace_events,
    }

    # Only include messages key when there are deletions to perform.
    # Returning an empty list via the add_messages reducer is a no-op,
    # but being explicit avoids any edge-case reducer surprises.
    if messages_to_remove:
        response_update["messages"] = messages_to_remove

    # Unclear intent: generate a clarifying question inline.
    # route_from_orchestrator in graph.py sends "unclear" to END, so we
    # must attach the reply here or the user gets silence.
    if result.message_type == "unclear":
        from langchain_core.messages import AIMessage
        clarification = AIMessage(content=(
            "I want to make sure I get you to the right place — could you "
            "tell me a bit more? For example, are you looking to buy "
            "something, need help with a product issue, or want to report "
            "a problem with an order?"
        ))
        # Merge with any RemoveMessage deletions already in the list
        existing = response_update.get("messages", [])
        response_update["messages"] = existing + [clarification]

    return response_update


# ── Isolated smoke test ──────────────────────────────────────────────────────

if __name__ == "__main__":
    tests = [
        "Do you have a wireless charger that works with a thick case?",
        "My smart plug won't connect to WiFi.",
        "I want a refund, this is the third time it's broken.",
        "Can we set up a call to discuss a bulk order?",
        "GM-10234",          # bare order ID — should classify as care/support with context
        "asdkjasd",
    ]
    for text in tests:
        s = {"messages": [HumanMessage(content=text)], "trace_log": [], "conversation_summary": ""}
        r = orchestrator_node(s)
        print(f"{text!r:55} -> {r['message_type']}")
