"""
Care Agent — handles complaints, damage reports, and refund requests for
GrowMart. Looks up orders and issues refunds directly for amounts at or
below REFUND_APPROVAL_THRESHOLD; anything above that is escalated to a
human via the Scheduling Agent rather than auto-approved.

Tool-calling based (like Sales Agent): order lookup and refund issuance
are conditional actions the LLM decides to take based on conversation,
not something needed on every turn.

Requires:
    pip install langchain-google-genai langgraph
    export GOOGLE_API_KEY=...
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, AIMessage

from backend.state import AgentState
from backend.tools.refunds import lookup_order, issue_refund, requires_manual_approval, REFUND_APPROVAL_THRESHOLD
from backend.tools.tickets import create_ticket

MODEL_NAME = "gemini-3.1-flash-lite"

SYSTEM_PROMPT = f"""You are GrowMart's AI Care Agent — empathetic, calm, and
efficient. You handle complaints, damaged/defective items, and refund
requests.

Your job — follow these steps in order, do not skip ahead:

1. Acknowledge the issue genuinely and briefly before doing anything else.
   One warm sentence, not an over-the-top apology.

2. Ask for the Order ID if you don't have it yet — you need it to look
   anything up.

3. Before checking refund eligibility, ask 1–2 follow-up questions to
   understand the actual problem:
   - What exactly is wrong? (defective, wrong item, damaged in transit,
     no longer needed, changed mind)
   - If the claim sounds like a technical issue rather than a genuine
     defect: "Have you tried [relevant troubleshooting step]? Sometimes
     that resolves it without needing a return." Only suggest this if it
     genuinely applies — don't use it as a stall tactic.
   Do not proceed to eligibility checks until you understand the reason.

4. Call lookup_order_details to verify the order exists and check its status.

5. Call check_refund_eligibility to determine whether it can be
   auto-approved (orders at or below ₹{REFUND_APPROVAL_THRESHOLD}) or
   needs human approval (above that amount).

6. If auto-approvable: call issue_order_refund directly. Confirm clearly:
   amount refunded, and that it typically reflects in 5–7 business days.

7. If it needs manual approval: do NOT issue it yourself. Explain that
   refunds above ₹{REFUND_APPROVAL_THRESHOLD} require a specialist to
   review — the customer will be scheduled a callback. Be warm but honest:
   don't promise a specific outcome.

8. Never issue a refund for an order that doesn't exist or was already
   refunded — relay what the tools tell you, honestly.

9. Stay factual — don't invent timelines or policies beyond what the
   tools confirm.
"""


# --- Tools -----------------------------------------------------------------

@tool
def lookup_order_details(order_id: str) -> str:
    """
    Look up an order by its Order ID to verify it exists and check its
    product, amount, and current status before taking any action.

    Args:
        order_id: The customer's order ID, e.g. "GM-10234".
    """
    result = lookup_order(order_id)
    if "error" in result:
        return f"Could not find order {order_id}: {result['detail']}"
    return (
        f"Order {result['order_id']}: {result['product']}, "
        f"amount ₹{result['amount']}, status: {result['status']}, "
        f"ordered on {result['order_date']}, customer: {result['customer_name']}"
    )


@tool
def check_refund_eligibility(order_id: str) -> str:
    """
    Check whether a refund for this order can be auto-approved or requires
    manual human approval, based on the order amount. Always call this
    before calling issue_refund.

    Args:
        order_id: The customer's order ID, e.g. "GM-10234".
    """
    order = lookup_order(order_id)
    if "error" in order:
        return f"Cannot check eligibility — order {order_id} not found."

    if order["status"] == "refunded":
        return f"Order {order_id} was already refunded on {order.get('refunded_at')}."

    if requires_manual_approval(order_id):
        return (
            f"Order {order_id} (₹{order['amount']}) exceeds the ₹{REFUND_APPROVAL_THRESHOLD} "
            "auto-approval limit and requires manual human approval. Do not issue this refund "
            "yourself — route to a specialist instead."
        )

    return f"Order {order_id} (₹{order['amount']}) is eligible for auto-approved refund."


@tool
def issue_order_refund(order_id: str) -> str:
    """
    Issue a refund for an order. Only call this AFTER check_refund_eligibility
    has confirmed the order is auto-approvable — never call this for an
    order that requires manual approval.

    Args:
        order_id: The customer's order ID, e.g. "GM-10234".
    """
    if requires_manual_approval(order_id):
        return f"Refund for {order_id} requires manual approval — cannot auto-issue. Route to a specialist."

    result = issue_refund(order_id)
    if "error" in result:
        return f"Refund failed: {result['detail']}"

    return (
        f"Refund issued successfully. Refund ID: {result['refund_id']}, "
        f"amount: ₹{result['amount']}, status: {result['status']}. "
        "Funds typically reflect in the customer's account within 5-7 business days."
    )


TOOLS = [lookup_order_details, check_refund_eligibility, issue_order_refund]


def _get_llm():
    return ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.3).bind_tools(TOOLS)


def _mentions_repeat_issue(text: str) -> bool:
    """Cheap heuristic — same style as support_agent's frustration check."""
    markers = ["again", "third time", "still broken", "same issue", "already told you"]
    lowered = text.lower()
    return any(m in lowered for m in markers)


# --- Node function -----------------------------------------------------

def care_agent_node(state: AgentState, config: dict = None, *, store=None) -> dict:
    """
    LangGraph node for the Care Agent. Tool-calling based: the LLM looks up
    the order, checks refund eligibility, and either issues the refund
    directly or flags for human escalation — enforced by the eligibility
    check tool, not just prompt instructions, so the ₹ threshold guardrail
    can't be bypassed by the model ignoring the system prompt.
    """
    messages = state["messages"]
    last_user_message = messages[-1].content if messages else ""

    llm = _get_llm()
    conversation = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    response = llm.invoke(conversation)

    trace_events = []
    needs_escalation = False
    # Track order details seen this turn so the ticket can reference them
    _order_id_seen:   str | None   = None
    _order_amount:    float | None = None

    while response.tool_calls:
        tool_messages = []
        for call in response.tool_calls:
            tool_name = call["name"]
            order_id = call["args"].get("order_id", "")

            if tool_name == "lookup_order_details":
                trace_events.append({
                    "agent": "care_agent", "action": "lookup_order",
                    "order_id": order_id, "status": "calling",
                })
                result = lookup_order_details.invoke(call["args"])
                if order_id:
                    _order_id_seen = order_id
                    # Extract amount from result string if available
                    if "amount ₹" in result:
                        try:
                            _order_amount = float(result.split("amount ₹")[1].split(",")[0].replace(",", ""))
                        except Exception:
                            pass

            elif tool_name == "check_refund_eligibility":
                trace_events.append({
                    "agent": "care_agent", "action": "check_eligibility",
                    "order_id": order_id, "status": "calling",
                })
                result = check_refund_eligibility.invoke(call["args"])
                if order_id:
                    _order_id_seen = order_id
                if "requires manual approval" in result.lower():
                    needs_escalation = True
                    # Try to extract amount from eligibility response
                    if "(₹" in result:
                        try:
                            _order_amount = float(result.split("(₹")[1].split(")")[0].replace(",", ""))
                        except Exception:
                            pass
                trace_events.append({
                    "agent": "care_agent", "action": "check_eligibility",
                    "order_id": order_id, "status": "done", "result": result,
                })

            elif tool_name == "issue_order_refund":
                trace_events.append({
                    "agent": "care_agent", "action": "issue_refund",
                    "order_id": order_id, "status": "calling",
                })
                result = issue_order_refund.invoke(call["args"])
                refund_amount = None
                if "amount: ₹" in result:
                    try:
                        refund_amount = float(result.split("amount: ₹")[1].split(",")[0].replace(",", ""))
                    except Exception:
                        pass
                trace_events.append({
                    "agent": "care_agent", "action": "issue_refund",
                    "order_id": order_id, "status": "done", "result": result,
                    "refund_signal": refund_amount,
                })
            else:
                result = f"Unknown tool: {tool_name}"

            tool_messages.append({
                "role": "tool",
                "content": result,
                "tool_call_id": call["id"],
            })

        conversation = conversation + [response] + tool_messages
        response = llm.invoke(conversation)

    # Escalate to Scheduling Agent if the refund needed manual approval,
    # or if the customer is describing a repeat/unresolved issue.
    route_to = None
    if needs_escalation or _mentions_repeat_issue(last_user_message):
        route_to = "scheduling_agent"
        reason = "refund_above_threshold" if needs_escalation else "repeat_issue"

        # Build transcript from messages for the ticket
        transcript = []
        for m in messages:
            role = getattr(m, "type", "unknown")
            content = getattr(m, "content", "")
            if isinstance(content, list):
                content = " ".join(p.get("text","") for p in content if isinstance(p,dict))
            if role in ("human", "ai") and content:
                transcript.append({"role": "user" if role == "human" else "assistant", "text": str(content)[:400]})

        # Add the current response
        resp_content = getattr(response, "content", "")
        if isinstance(resp_content, list):
            resp_content = " ".join(p.get("text","") for p in resp_content if isinstance(p,dict))
        if resp_content:
            transcript.append({"role": "assistant", "text": str(resp_content)[:400]})

        summary = (
            f"Refund request for order {_order_id_seen or 'unknown'} — ₹{_order_amount or '?'}, needs human approval."
            if needs_escalation else
            f"Repeat/unresolved issue: {last_user_message[:120]}"
        )

        # Persist to Supabase via tickets tool
        user_id = (config or {}).get("configurable", {}).get("user_id", "user-aditi")
        try:
            ticket = create_ticket(
                user_id=user_id,
                agent="care_agent",
                reason=reason,
                summary=summary,
                order_id=_order_id_seen,
                amount=_order_amount,
                transcript=transcript,
                trace=trace_events,
            )
            trace_events.append({
                "agent": "care_agent", "action": "create_ticket",
                "ticket_id": ticket["ticket_id"], "status": "done",
                "detail": f"Ticket {ticket['ticket_id']} created",
            })
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            trace_events.append({
                "agent": "care_agent", "action": "create_ticket",
                "status": "error", "detail": f"Ticket creation failed: {str(e)}",
            })
            print(f"[care_agent] ticket creation error: {error_detail}")

        trace_events.append({
            "agent": "care_agent", "action": "escalate",
            "reason": reason,
        })

    result_state = {
        "messages": [response],
        "current_agent": "care_agent",
        "trace_log": state.get("trace_log", []) + trace_events,
        "awaiting_agent_response": not route_to and not any(
            ev.get("action") in ("issue_refund", "check_eligibility") for ev in trace_events
        ),
    }
    if route_to:
        result_state["route_to"] = route_to
        result_state["awaiting_agent_response"] = False

    return result_state