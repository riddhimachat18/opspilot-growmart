"""
backend/tools/refunds.py — order gateway backed by Supabase.

Reads and writes the same `orders` table that db.py uses, so an order
placed via the checkout flow is immediately visible to the Care Agent's
lookup_order tool. Same function signatures as before — care_agent.py
doesn't need to change.
"""

import uuid
from datetime import datetime, timezone
import backend.tools.db as db

REFUND_APPROVAL_THRESHOLD = 1500  # ₹ — above this, escalate to human review


def lookup_order(order_id: str) -> dict:
    """
    Look up an order by ID from Supabase.
    Returns a dict with order details, or {"error": "not_found"}.
    """
    row = db.get_order_by_id(order_id)
    if not row:
        return {"error": "not_found", "detail": f"No order found with ID {order_id}"}
    # Normalise field names — Supabase row uses order_id, db.py already does that
    return {
        "order_id":      row.get("order_id"),
        "customer_name": row.get("customer_name", ""),
        "customer_email":row.get("customer_email", ""),
        "product":       row.get("product", ""),
        "amount":        float(row.get("amount", 0)),
        "status":        row.get("status", ""),
        "order_date":    row.get("order_date", ""),
        "refund_id":     row.get("refund_id"),
        "refunded_at":   row.get("refunded_at"),
    }


def issue_refund(order_id: str) -> dict:
    """
    Mark an order as refunded in Supabase and return a confirmation dict.
    Also credits the user's wallet via db.credit_wallet.
    """
    order = lookup_order(order_id)
    if "error" in order:
        return order

    if order["status"] == "refunded":
        return {
            "error": "already_refunded",
            "detail": f"Order {order_id} was already refunded on {order['refunded_at']}",
        }

    refund_id   = f"re_mock_{uuid.uuid4().hex[:16]}"
    refunded_at = datetime.now(timezone.utc).isoformat()

    # Update order status in Supabase
    db.refund_order(order_id, refund_id)

    # Credit the wallet so the balance updates in real time on the frontend
    try:
        db.credit_wallet(
            "user-aditi",
            order["amount"],
            f"Refund for order {order_id}",
        )
    except Exception:
        pass  # wallet credit failure shouldn't block the refund confirmation

    return {
        "refund_id":   refund_id,
        "order_id":    order_id,
        "amount":      order["amount"],
        "status":      "succeeded",
        "refunded_at": refunded_at,
    }


def requires_manual_approval(order_id: str) -> bool:
    """True when the order amount exceeds the auto-approval threshold."""
    order = lookup_order(order_id)
    if "error" in order:
        return False
    return float(order["amount"]) > REFUND_APPROVAL_THRESHOLD


if __name__ == "__main__":
    print(lookup_order("GM-10234"))
    print(requires_manual_approval("GM-10237"))
