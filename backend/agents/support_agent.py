"""
Support Agent — handles post-sale troubleshooting, shipping, returns,
warranty, and account queries by grounding every answer in the GrowMart
knowledge base (see tools/kb_search.py). Escalates to the Scheduling
Agent when it detects repeated frustration or an unresolved issue.

Retrieval is unconditional (always runs before generation) instead of
being left to the model's tool-calling decision. This guarantees a trace
event fires on every support question.

Run as part of the package (from project root):
    python -m backend.main
Do not run this file directly — it relies on absolute imports
(backend.state, backend.tools.kb_search) that only resolve when run as
a module from the project root.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from backend.state import AgentState
from backend.tools.kb_search import search_kb, get_retrieved_sources
from backend.tools.tickets import create_ticket

MODEL_NAME = "gemini-3.1-flash-lite"
MAX_UNRESOLVED_TURNS = 2  # after this many failed attempts, auto-escalate

SYSTEM_PROMPT = """You are GrowMart's AI Support Agent.

You will be given retrieved knowledge base context and a customer question.

Rules you must follow:
1. Answer ONLY using the provided context below. Do not use outside
   knowledge or guess at GrowMart's policies.
2. If the context does not contain the answer, say honestly: "I don't have
   that information" and offer to escalate to a human agent. Do not invent
   policy details.
3. Keep answers concise and step-by-step for troubleshooting questions.
4. Never promise a refund or replacement yourself — that's handled by the
   Care Agent. If one seems warranted, say you're passing this to the
   right specialist.
"""


def _get_llm():
    return ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.3)


def _looks_frustrated(text: str) -> bool:
    frustration_markers = [
        "still not working", "again", "third time", "frustrated",
        "annoyed", "useless", "not helping", "speak to a human",
        "talk to a person", "this is ridiculous",
    ]
    lowered = text.lower()
    return any(marker in lowered for marker in frustration_markers)


def support_agent_node(state: AgentState, config: dict = None, *, store=None) -> dict:
    """
    LangGraph node for the Support Agent.

    Flow (unconditional, not tool-call-dependent):
      1. Embed the user's query and retrieve top-k chunks from Chroma
      2. Emit a trace event showing which KB articles were pulled
      3. Pass retrieved context + query to the LLM, constrained to answer
         only from that context
    """
    messages = state["messages"]
    unresolved_turns = state.get("unresolved_turns", 0)
    last_user_message = messages[-1].content if messages else ""

    # --- Escalation check before doing any retrieval/generation --------
    frustrated = _looks_frustrated(last_user_message)
    should_escalate = frustrated or unresolved_turns >= MAX_UNRESOLVED_TURNS

    if should_escalate:
        user_id = (config or {}).get("configurable", {}).get("user_id", "user-aditi")

        # Build minimal transcript for the ticket
        transcript = []
        for m in messages[-6:]:  # last 3 turns is enough context
            role = getattr(m, "type", "unknown")
            content = getattr(m, "content", "")
            if isinstance(content, list):
                content = " ".join(p.get("text","") for p in content if isinstance(p,dict))
            if role in ("human","ai") and content:
                transcript.append({"role":"user" if role=="human" else "assistant","text":str(content)[:400]})

        try:
            ticket = create_ticket(
                user_id=user_id,
                agent="support_agent",
                reason="repeat_issue",
                summary=f"Unresolved after {unresolved_turns} attempts: {last_user_message[:120]}",
                transcript=transcript,
                trace=[],
            )
        except Exception:
            ticket = {}

        return {
            "messages": [
                AIMessage(
                    content=(
                        "I understand this hasn't been resolved yet — let me "
                        "connect you with a support specialist. I'll get you "
                        "scheduled for a callback."
                    )
                )
            ],
            "current_agent": "support_agent",
            "route_to": "scheduling_agent",
            "awaiting_agent_response": False,
            "unresolved_turns": unresolved_turns,
        }

    # --- Step 1 & 2: unconditional retrieval + trace event -------------
    sources = get_retrieved_sources(last_user_message, k=3)
    context = search_kb(last_user_message, k=3)

    trace_event = {
        "agent": "support_agent",
        "action": "kb_search",
        "query": last_user_message,
        "sources": [s["source_file"] for s in sources],
    }

    # --- Step 3: grounded generation ------------------------------------
    grounded_prompt = f"""Context retrieved from the knowledge base:

{context}

Customer question: {last_user_message}
"""

    llm = _get_llm()
    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=grounded_prompt),
    ])

    def _response_text(resp) -> str:
        """Normalize LLM response content to a plain string.

        Some LLMs (or structured outputs) return a list of content parts
        instead of a single string; handle both cases safely.
        """
        content = getattr(resp, "content", None)
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for p in content:
                if isinstance(p, str):
                    parts.append(p)
                elif isinstance(p, dict):
                    text = p.get("text") or p.get("content")
                    if isinstance(text, str):
                        parts.append(text)
            return "".join(parts)
        return str(content) if content is not None else ""

    resolved_markers = ["don't have that information", "connect you with", "escalate"]
    still_unresolved = any(m in _response_text(response).lower() for m in resolved_markers)

    return {
        "messages": [response],
        "current_agent": "support_agent",
        "trace_log": state.get("trace_log", []) + [trace_event],
        "unresolved_turns": unresolved_turns + 1 if still_unresolved else 0,
        # Support answers are self-contained per turn — the KB retrieval +
        # grounded generation resolves in one shot. Stay sticky only if the
        # response itself says it couldn't resolve (still_unresolved), which
        # means we may need more clarification from the user next turn.
        "awaiting_agent_response": bool(still_unresolved),
    }