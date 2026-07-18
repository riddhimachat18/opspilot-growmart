"""
backend/tools/tickets.py — creates and reads support tickets in Supabase.

Called by care_agent and support_agent whenever they escalate.
The ticket is immediately visible in /admin/tickets and the customer's
/growmart/tickets tab — no separate polling needed, same DB row.
"""

import backend.tools.db as db


def create_ticket(
    *,
    user_id: str,
    agent: str,
    reason: str,
    summary: str,
    order_id: str | None = None,
    amount: float | None = None,
    transcript: list | None = None,
    trace: list | None = None,
) -> dict:
    """
    Persist an escalation ticket to Supabase and return it.

    Args:
        user_id:    LangGraph user_id from config["configurable"]["user_id"].
        agent:      "care_agent" | "support_agent"
        reason:     "refund_above_threshold" | "repeat_issue" | "scheduling_requested"
        summary:    One-sentence description shown in the ticket list.
        order_id:   Related order, if any.
        amount:     Refund amount in question, if any.
        transcript: List of {role, text} dicts from this conversation.
        trace:      List of trace event dicts from this turn.
    """
    # Map internal user_id to the demo user — in production, use the real user_id
    safe_user_id = user_id if user_id and user_id != "anonymous" else "user-aditi"

    tid = db.add_ticket(
        user_id=safe_user_id,
        order_id=order_id,
        issue=summary,
        agent=agent,
        status="escalated" if reason == "refund_above_threshold" else "pending",
        amount=amount,
        transcript=transcript or [],
        trace=trace or [],
    )

    return {
        "ticket_id": tid,
        "user_id":   safe_user_id,
        "agent":     agent,
        "reason":    reason,
        "summary":   summary,
        "order_id":  order_id,
        "amount":    amount,
        "status":    "escalated" if reason == "refund_above_threshold" else "pending",
    }
