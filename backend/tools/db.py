"""
backend/tools/db.py — Supabase-backed data layer for GrowMart.

All functions have the same signatures as the previous SQLite version so
nothing else in the codebase needs to change.

Setup:
    1. Run supabase_schema.sql in your Supabase SQL Editor.
    2. Add to .env:
           SUPABASE_URL=https://xxxx.supabase.co
           SUPABASE_SERVICE_KEY=eyJ...   (service_role key, not anon)
    3. pip install supabase

The service_role key bypasses RLS — correct for server-side use.
Never expose it to the frontend.
"""

import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_client: Client | None = None


def _sb() -> Client:
    """Return a cached Supabase client, created lazily."""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise EnvironmentError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env. "
                "Get them from Supabase → Settings → API."
            )
        _client = create_client(url, key)
    return _client


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── User ──────────────────────────────────────────────────────────────────────

def get_user(user_id: str = "user-aditi") -> dict | None:
    res = _sb().table("users").select("*").eq("id", user_id).execute()
    return res.data[0] if res.data else None


# ── Orders ────────────────────────────────────────────────────────────────────

def get_orders(user_id: str = "user-aditi") -> list[dict]:
    res = _sb().table("orders").select("*").eq("user_id", user_id).order("order_date", desc=True).execute()
    return res.data or []


def get_order_by_id(order_id: str) -> dict | None:
    res = _sb().table("orders").select("*").eq("order_id", order_id).execute()
    return res.data[0] if res.data else None


def place_order(user_id: str, product: str, amount: float) -> str:
    import random
    order_id = f"GM-{10250 + random.randint(0, 999)}"
    user     = get_user(user_id) or {}
    _sb().table("orders").insert({
        "order_id":       order_id,
        "user_id":        user_id,
        "product":        product,
        "amount":         amount,
        "status":         "processing",
        "order_date":     _now()[:10],
        "customer_name":  user.get("name", ""),
        "customer_email": user.get("email", ""),
    }).execute()
    return order_id


def refund_order(order_id: str, refund_id: str) -> None:
    _sb().table("orders").update({
        "status":      "refunded",
        "refund_id":   refund_id,
        "refunded_at": _now(),
    }).eq("order_id", order_id).execute()


# ── Cart ──────────────────────────────────────────────────────────────────────

def get_cart(user_id: str = "user-aditi") -> list[dict]:
    res = _sb().table("cart").select("*").eq("user_id", user_id).order("added_at", desc=True).execute()
    return res.data or []


def upsert_cart_item(user_id: str, product_id: str, quantity: int = 1) -> None:
    res = _sb().table("cart").select("id, quantity").eq("user_id", user_id).eq("product_id", product_id).execute()
    existing = res.data[0] if res.data else None
    if existing:
        new_qty = existing["quantity"] + quantity
        _sb().table("cart").update({"quantity": new_qty}).eq("user_id", user_id).eq("product_id", product_id).execute()
    else:
        _sb().table("cart").insert({
            "user_id":    user_id,
            "product_id": product_id,
            "quantity":   quantity,
            "added_at":   _now(),
        }).execute()


def upsert_cart_item_set(user_id: str, product_id: str, quantity: int = 1) -> None:
    """Set exact quantity (used by frontend updateQty)."""
    res = _sb().table("cart").select("id").eq("user_id", user_id).eq("product_id", product_id).execute()
    existing = res.data[0] if res.data else None
    if existing:
        _sb().table("cart").update({"quantity": quantity}).eq("user_id", user_id).eq("product_id", product_id).execute()
    else:
        _sb().table("cart").insert({
            "user_id":    user_id,
            "product_id": product_id,
            "quantity":   quantity,
            "added_at":   _now(),
        }).execute()


def remove_cart_item(user_id: str, product_id: str) -> None:
    _sb().table("cart").delete().eq("user_id", user_id).eq("product_id", product_id).execute()


def update_cart_qty(user_id: str, product_id: str, quantity: int) -> None:
    if quantity < 1:
        return remove_cart_item(user_id, product_id)
    upsert_cart_item_set(user_id, product_id, quantity)


def clear_cart(user_id: str) -> None:
    _sb().table("cart").delete().eq("user_id", user_id).execute()


# ── Wishlist ──────────────────────────────────────────────────────────────────

def get_wishlist(user_id: str = "user-aditi") -> list[dict]:
    res = _sb().table("wishlist").select("*").eq("user_id", user_id).order("added_at", desc=True).execute()
    return res.data or []


def add_to_wishlist(user_id: str, product_id: str) -> None:
    _sb().table("wishlist").upsert(
        {"user_id": user_id, "product_id": product_id, "added_at": _now()},
        on_conflict="user_id,product_id", ignore_duplicates=True,
    ).execute()


def remove_from_wishlist(user_id: str, product_id: str) -> None:
    _sb().table("wishlist").delete().eq("user_id", user_id).eq("product_id", product_id).execute()


# ── Tickets ───────────────────────────────────────────────────────────────────

def get_tickets(user_id: str = "user-aditi") -> list[dict]:
    res = _sb().table("tickets").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data or []


def get_all_tickets() -> list[dict]:
    """Admin: all tickets with customer name/email joined from users."""
    res = _sb().table("tickets").select("*, users(name, email)").order("created_at", desc=True).execute()
    rows = res.data or []
    # Flatten joined user data
    for r in rows:
        if "users" in r and r["users"]:
            r["customer_name"]  = r["users"].get("name", "")
            r["customer_email"] = r["users"].get("email", "")
            del r["users"]
    return rows


def add_ticket(user_id: str, order_id: str | None, issue: str, agent: str,
               status: str, amount: float | None, transcript: list, trace: list) -> str:
    tid = f"TKT-{uuid.uuid4().hex[:6].upper()}"
    _sb().table("tickets").insert({
        "id":         tid,
        "user_id":    user_id,
        "order_id":   order_id,
        "issue":      issue,
        "agent":      agent,
        "status":     status,
        "amount":     amount,
        "created_at": _now(),
        "transcript": transcript,
        "trace":      trace,
    }).execute()
    return tid


def resolve_ticket(ticket_id: str, action: str = "approved") -> None:
    _sb().table("tickets").update({
        "status":      action,
        "resolved_at": _now(),
    }).eq("id", ticket_id).execute()


# ── Chat history ──────────────────────────────────────────────────────────────

def get_chat_history(user_id: str = "user-aditi") -> list[dict]:
    res = _sb().table("chat_history").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data or []


def add_chat_history(user_id: str, summary: str, agent: str, outcome: str, preview: str = "") -> None:
    _sb().table("chat_history").insert({
        "user_id":    user_id,
        "summary":    summary,
        "agent":      agent,
        "outcome":    outcome,
        "preview":    preview,
        "created_at": _now(),
    }).execute()


# ── Wallet ────────────────────────────────────────────────────────────────────

def credit_wallet(user_id: str, amount: float, description: str = "") -> float:
    # Atomic increment via RPC (avoids read-modify-write race)
    _sb().table("users").update({"wallet": _get_wallet(user_id) + amount}).eq("id", user_id).execute()
    _sb().table("wallet_transactions").insert({
        "user_id":     user_id,
        "type":        "credit",
        "amount":      amount,
        "description": description,
        "created_at":  _now(),
    }).execute()
    return _get_wallet(user_id)


def debit_wallet(user_id: str, amount: float, description: str = "") -> float:
    new_bal = max(0, _get_wallet(user_id) - amount)
    _sb().table("users").update({"wallet": new_bal}).eq("id", user_id).execute()
    _sb().table("wallet_transactions").insert({
        "user_id":     user_id,
        "type":        "debit",
        "amount":      amount,
        "description": description,
        "created_at":  _now(),
    }).execute()
    return new_bal


def _get_wallet(user_id: str) -> float:
    res = _sb().table("users").select("wallet").eq("id", user_id).execute()
    return float(res.data[0]["wallet"]) if res.data else 0.0


def get_wallet_transactions(user_id: str = "user-aditi") -> list[dict]:
    res = _sb().table("wallet_transactions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
    return res.data or []


# ── Smoke test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("User:    ", get_user())
    print("Orders:  ", len(get_orders()))
    print("Cart:    ", get_cart())
    print("Wishlist:", get_wishlist())
    print("Tickets: ", len(get_tickets()))
    print("History: ", len(get_chat_history()))
    print("Wallet:  ", _get_wallet("user-aditi"))
