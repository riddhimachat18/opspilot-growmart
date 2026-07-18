"""
Scheduling Agent — books human callback slots on Google Calendar. Reached
either directly (user asks for a callback / bulk order consultation) or
via escalation from Support Agent or Care Agent (route_to field in state).

Tool-calling based: offers available slots, books on confirmation.

Requires:
    pip install langchain-google-genai langgraph google-api-python-client google-auth
    export GOOGLE_API_KEY=...            # for Gemini generation
    (GOOGLE_SERVICE_ACCOUNT_FILE / GOOGLE_CALENDAR_ID set in .env for Calendar API)
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage

from backend.state import AgentState
from backend.tools.calendar import get_available_slots, book_slot

MODEL_NAME = "gemini-3.1-flash-lite"

SYSTEM_PROMPT = """You are GrowMart's AI Scheduling Agent. You book callback
slots with a human specialist — used for escalated support/care issues,
or bulk/corporate order consultations.

Your job:
1. If you're picking up mid-conversation after an escalation (the customer
   didn't ask for this directly), briefly acknowledge why: e.g. "Let's get
   you scheduled with a specialist for this."
2. Call find_open_slots to get real available times — never make up times.
3. Present 2-3 options clearly and ask the customer to pick one.
4. Once they confirm a slot, you need their name and email to book it — ask
   if you don't have it from earlier in the conversation.
5. Call confirm_booking with the chosen slot and their details.
6. Confirm the booking clearly: date/time and that they'll receive a
   calendar invite/confirmation.
7. Keep it efficient — this should feel like a quick, easy scheduling step,
   not a long conversation.
"""


# --- Tools -----------------------------------------------------------------

@tool
def find_open_slots(days_ahead: int = 3) -> str:
    """
    Find real available callback slots over the next few business days.
    Always call this before offering times to the customer — never invent
    availability.

    Args:
        days_ahead: How many days ahead to search (default 3).
    """
    slots = get_available_slots(days_ahead=days_ahead, max_slots=3)
    if not slots:
        return "No available slots found in the next few days. Suggest trying a wider range or contacting support directly."

    formatted = "\n".join(f"{i+1}. {s['label']}" for i, s in enumerate(slots))
    # Encode raw ISO times so the model can pass them back exactly when booking
    raw = "\n".join(f"[slot {i+1} iso: start={s['start']} end={s['end']}]" for i, s in enumerate(slots))
    return f"Available slots:\n{formatted}\n\n{raw}"


@tool
def confirm_booking(start_iso: str, end_iso: str, customer_name: str, customer_email: str, reason: str = "") -> str:
    """
    Book the chosen callback slot on the calendar. Only call this after the
    customer has explicitly confirmed which slot they want, and you have
    their name and email.

    Args:
        start_iso: Exact ISO start datetime of the chosen slot (from find_open_slots output).
        end_iso: Exact ISO end datetime of the chosen slot.
        customer_name: Customer's name.
        customer_email: Customer's email.
        reason: Brief reason for the callback, e.g. "Refund escalation - Order GM-10240".
    """
    result = book_slot(start_iso, end_iso, customer_name, customer_email, reason)
    if "error" in result:
        return f"Booking failed: {result['detail']}. Let the customer know and offer to try again or escalate manually."

    return f"Booking confirmed for {customer_name} at {start_iso}. Event ID: {result['event_id']}."


TOOLS = [find_open_slots, confirm_booking]


def _get_llm():
    return ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.3).bind_tools(TOOLS)


# --- Node function -----------------------------------------------------

def scheduling_agent_node(state: AgentState, config: dict = None, *, store=None) -> dict:
    """
    LangGraph node for the Scheduling Agent. Handles both direct requests
    and escalations from support_agent/care_agent (their route_to field
    lands the graph here via a conditional edge in graph.py).
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

            if tool_name == "find_open_slots":
                trace_events.append({
                    "agent": "scheduling_agent", "action": "find_slots", "status": "calling",
                })
                result = find_open_slots.invoke(call["args"])
                trace_events.append({
                    "agent": "scheduling_agent", "action": "find_slots", "status": "done",
                })

            elif tool_name == "confirm_booking":
                trace_events.append({
                    "agent": "scheduling_agent", "action": "book_slot", "status": "calling",
                    "customer_name": call["args"].get("customer_name"),
                })
                result = confirm_booking.invoke(call["args"])
                trace_events.append({
                    "agent": "scheduling_agent", "action": "book_slot", "status": "done",
                    "result": result,
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
        "current_agent": "scheduling_agent",
        "trace_log": state.get("trace_log", []) + trace_events,
        "route_to": None,               # clear escalation flag
        "awaiting_agent_response": False,  # booking confirmed, task complete
    }