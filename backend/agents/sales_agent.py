"""
Sales Agent — handles pre-sale product inquiries for GrowMart. Qualifies
visitors on device compatibility, budget, and use case, recommends
products from the catalog, and creates a CRM lead when a visitor is
interested but not ready to buy immediately.

Unlike the Support Agent (which always retrieves before answering), this
agent uses tool-calling — the LLM decides when to check the catalog or
create a lead, since those are conditional actions, not something needed
on every single turn.

Requires:
    pip install langchain-google-genai langgraph
    export GOOGLE_API_KEY=...
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, AIMessage

from backend.state import AgentState
from backend.tools.crm import create_lead, find_lead_by_email

MODEL_NAME = "gemini-3.1-flash-lite"

# --- Product catalog (seed data — swap for a real DB/table later) --------

PRODUCT_CATALOG = [
    {"name": "MagCharge 15W Wireless Charger", "price": "₹1,499",
     "features": "15W fast charging, case-friendly up to 3mm, magnetic alignment"},
    {"name": "SmartPlug Single", "price": "₹549",
     "features": "WiFi-controlled outlet, app scheduling, works with voice assistants"},
    {"name": "SmartPlug Duo Pack", "price": "₹899",
     "features": "Two WiFi-controlled outlets, ideal for lamps/small appliances"},
    {"name": "EchoBuds Pro", "price": "₹2,299",
     "features": "Wireless earbuds, active noise cancellation, 24hr battery with case"},
    {"name": "PowerBank 10000mAh", "price": "₹1,199",
     "features": "Compact fast-charging power bank, dual USB-C/USB-A output"},
    {"name": "LED Strip Light Kit", "price": "₹999",
     "features": "App and voice-controlled RGB lighting, 5m length, adhesive + mounting clips"},
    {"name": "SmartWatch Fit", "price": "₹3,499",
     "features": "Heart-rate and sleep tracking, 7-day battery, app sync"},
    {"name": "USB-C Fast Charger 65W", "price": "₹1,299",
     "features": "65W GaN charger, laptop and phone compatible, compact design"},
    {"name": "Car Charger Dual Port", "price": "₹699",
     "features": "Dual USB-C fast charging for two devices simultaneously"},
    {"name": "Bluetooth Speaker Mini", "price": "₹1,799",
     "features": "Portable speaker, 12hr battery, water-resistant IPX5"},
]

SYSTEM_PROMPT = f"""You are GrowMart's AI Sales Agent — friendly, helpful, never pushy.

GrowMart's product catalog:
{chr(10).join(f"- {p['name']} ({p['price']}): {p['features']}" for p in PRODUCT_CATALOG)}

Your job:
1. Understand what the visitor is looking for.
2. Ask relevant qualifying questions when useful: device compatibility
   (phone model, case usage for chargers), budget range (Under ₹1000 /
   ₹1000–2000 / ₹2000+), and use case (personal use, gift, or bulk/office
   purchase). Don't interrogate — ask 1-2 questions at a time naturally.
3. Recommend 1–2 products from the catalog above with a short rationale
   tailored to what they told you. Never recommend a product not in the
   catalog above.
4. If the visitor explicitly says they want to buy / add to cart, ask once
   to confirm: "Want me to add the [product name] to your cart?" — then
   call add_to_cart only after they say yes. Never add without confirmation.
5. If the visitor seems interested but isn't ready to commit, call
   create_crm_lead with their details so we can follow up later. Ask for
   their name and email naturally if you don't have it yet.
6. After creating a lead, draft a short warm follow-up email (2-3 sentences)
   referencing what they were interested in. Present it as a draft — do not
   claim you've sent it.
7. If they're ready to buy now, call add_to_cart and then tell them their
   cart has been updated — they can check out at any time.
"""


# --- Tools -----------------------------------------------------------------

@tool
def check_product_catalog(query: str) -> str:
    """
    Look up products in GrowMart's catalog matching a description or need
    (e.g. "wireless charger", "something for home automation", "gift under 1000").
    Use this to ground your recommendation instead of relying on memory.
    """
    query_lower = query.lower()
    matches = [
        p for p in PRODUCT_CATALOG
        if any(word in p["name"].lower() or word in p["features"].lower()
               for word in query_lower.split())
    ]
    results = matches if matches else PRODUCT_CATALOG
    return "\n".join(f"{p['name']} — {p['price']}: {p['features']}" for p in results)


@tool
def create_crm_lead(
    name: str,
    email: str,
    product_interest: str,
    budget_range: str,
    use_case_notes: str = "",
) -> str:
    """
    Create a lead in the CRM for a visitor who is interested but not ready
    to purchase yet. Call this once you have at least their name, email,
    and what product they're interested in.

    Args:
        name: Visitor's name.
        email: Visitor's email.
        product_interest: The product(s) they showed interest in.
        budget_range: One of "Under ₹1000", "₹1000–2000", "₹2000+".
        use_case_notes: Brief notes on their use case (personal/gift/bulk, context).
    """
    existing = find_lead_by_email(email)
    if existing:
        return f"Lead already exists for {email} (id: {existing['id']}) — not creating a duplicate."

    result = create_lead(
        name=name,
        email=email,
        product_interest=product_interest,
        budget_range=budget_range,
        use_case_notes=use_case_notes,
        stage="New",
    )

    if "error" in result:
        return f"Failed to create lead: {result['detail']}"

    return f"Lead created successfully for {name} ({email}), interested in {product_interest}."


TOOLS = [check_product_catalog, create_crm_lead]

# Map catalog display names → product ID slugs (matches constants.js PRODUCTS)
CATALOG_SLUG_MAP = {
    "MagCharge 15W Wireless Charger": "magcharge-15w",
    "SmartPlug Single":               "smartplug-duo",   # closest match
    "SmartPlug Duo Pack":             "smartplug-duo",
    "EchoBuds Pro":                   "echobuds-pro",
    "PowerBank 10000mAh":             "powerbank-20k",
    "LED Strip Light Kit":            "led-strip-5m",
    "SmartWatch Fit":                 "smartwatch-s2",
    "USB-C Fast Charger 65W":         "powerbank-20k",
    "Car Charger Dual Port":          "powerbank-20k",
    "Bluetooth Speaker Mini":         "powerbank-20k",
}

@tool
def add_to_cart(product_name: str, quantity: int = 1) -> str:
    """
    Add a product to the customer's cart. Only call this AFTER the customer
    has explicitly confirmed they want it added — never call this just because
    they expressed interest or said "sounds good".

    Args:
        product_name: The exact product name from the catalog (case-insensitive match).
        quantity: Number of units to add (default 1).
    """
    name_lower = product_name.lower()
    match = None
    match_slug = None

    # Try exact match first
    for display_name, slug in CATALOG_SLUG_MAP.items():
        if display_name.lower() == name_lower:
            match = next(p for p in PRODUCT_CATALOG if p["name"].lower() == display_name.lower())
            match_slug = slug
            break

    # Partial match fallback
    if not match:
        for display_name, slug in CATALOG_SLUG_MAP.items():
            if name_lower in display_name.lower() or display_name.lower() in name_lower:
                match = next((p for p in PRODUCT_CATALOG if p["name"].lower() == display_name.lower()), None)
                match_slug = slug
                break

    if not match or not match_slug:
        return f"Product '{product_name}' not found in the catalog. Please use an exact product name."

    # Use the slug so main.py can write directly to Supabase without a name→slug lookup
    return f"CART_ADD::{match_slug}::{quantity}"


TOOLS = [check_product_catalog, create_crm_lead, add_to_cart]


def _get_llm():
    return ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.4).bind_tools(TOOLS)


# --- Node function -----------------------------------------------------

def sales_agent_node(state: AgentState, config: dict = None, *, store=None) -> dict:
    """
    LangGraph node for the Sales Agent. Tool-calling based: the LLM decides
    when to check the catalog or create a lead, based on conversation flow.
    """
    messages = state["messages"]
    llm = _get_llm()

    conversation = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    response = llm.invoke(conversation)

    trace_events = []

    while response.tool_calls:
        tool_messages = []
        for call in response.tool_calls:
            tool_name = call["name"]

            if tool_name == "check_product_catalog":
                trace_events.append({
                    "agent": "sales_agent",
                    "action": "check_product_catalog",
                    "query": call["args"].get("query", ""),
                })
                result = check_product_catalog.invoke(call["args"])

            elif tool_name == "create_crm_lead":
                trace_events.append({
                    "agent": "sales_agent",
                    "action": "create_lead",
                    "status": "creating",
                    "lead_name": call["args"].get("name"),
                    "product_interest": call["args"].get("product_interest"),
                })
                result = create_crm_lead.invoke(call["args"])
                trace_events.append({
                    "agent": "sales_agent",
                    "action": "create_lead",
                    "status": "done",
                    "result": result,
                })

            elif tool_name == "add_to_cart":
                pname = call["args"].get("product_name", "")
                qty   = call["args"].get("quantity", 1)
                trace_events.append({
                    "agent": "sales_agent",
                    "action": "add_to_cart",
                    "status": "calling",
                    "detail": f"{pname} × {qty}",
                })
                result = add_to_cart.invoke(call["args"])
                # Embed the cart signal in the trace event so main.py can detect it
                trace_events.append({
                    "agent": "sales_agent",
                    "action": "add_to_cart",
                    "status": "done",
                    "result": result,
                    "cart_signal": result if result.startswith("CART_ADD::") else None,
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

    return {
        "messages": [response],
        "current_agent": "sales_agent",
        "trace_log": state.get("trace_log", []) + trace_events,
        # Sales is conversational — each reply may ask a qualifying question.
        # Stay sticky so the user's answer (budget, device model, etc.) routes
        # back here instead of being re-classified by the orchestrator.
        "awaiting_agent_response": True,
    }