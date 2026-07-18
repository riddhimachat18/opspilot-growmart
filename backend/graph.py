"""
backend/graph.py — wires the orchestrator and all four agents into a
compiled LangGraph graph with:

  1. Sticky routing  — if an agent is mid-task (awaiting_agent_response=True),
     the next user message routes straight back to that agent without going
     through the orchestrator.
  2. Orchestrator classification — only runs when no agent owns the turn.
  3. Post-agent escalation — support/care can hand off to scheduling_agent
     in the same turn via route_to.

This is the single source of truth for graph structure. main.py only
imports `app_graph` from here.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from langgraph.graph import StateGraph, START, END

try:
    from langgraph.checkpoint.sqlite import SqliteSaver
    from langgraph.store.sqlite import SqliteStore
    checkpointer = SqliteSaver.from_conn_string("backend/checkpoints.db")
    store = SqliteStore.from_conn_string("backend/long_term_memory.db")
except ImportError:
    from langgraph.checkpoint.memory import MemorySaver
    from langgraph.store.memory import InMemoryStore
    checkpointer = MemorySaver()
    store = InMemoryStore()

from backend.state import AgentState
from backend.agents.orchestrator import orchestrator_node
from backend.agents.sales_agent import sales_agent_node
from backend.agents.support_agent import support_agent_node
from backend.agents.care_agent import care_agent_node
from backend.agents.scheduling_agent import scheduling_agent_node


# ---------------------------------------------------------------------------
# Entry router — runs at START before anything else.
# Implements sticky routing: skip the orchestrator when an agent is already
# mid-task and waiting for the user's follow-up reply.
# ---------------------------------------------------------------------------

def entry_router(state: AgentState) -> str:
    """
    If an agent asked the user a clarifying question last turn
    (awaiting_agent_response=True), bypass the orchestrator and send the
    user's reply straight back to that agent.

    Otherwise fall through to the orchestrator for fresh classification.
    """
    if state.get("awaiting_agent_response") and state.get("current_agent"):
        agent = state["current_agent"]
        # Map agent name strings to node names in the graph
        valid_nodes = {"sales_agent", "support_agent", "care_agent", "scheduling_agent"}
        if agent in valid_nodes:
            return agent
    return "orchestrator"


# ---------------------------------------------------------------------------
# Post-orchestrator router — reads message_type set by orchestrator_node
# ---------------------------------------------------------------------------

def route_from_orchestrator(state: AgentState) -> str:
    """Route to the matching specialist after the orchestrator classifies."""
    return state["message_type"]


# ---------------------------------------------------------------------------
# Post-agent router — handles same-turn escalation handoffs
# ---------------------------------------------------------------------------

def route_after_agent(state: AgentState) -> str:
    """
    If an agent set route_to (e.g. support escalating to scheduling),
    continue to that node in the same turn. Otherwise end the turn.
    """
    route_to = state.get("route_to")
    return route_to if route_to else END


# ---------------------------------------------------------------------------
# Build graph
# ---------------------------------------------------------------------------

graph = StateGraph(AgentState)

# Nodes
graph.add_node("orchestrator",      orchestrator_node)
graph.add_node("sales_agent",       sales_agent_node)
graph.add_node("support_agent",     support_agent_node)
graph.add_node("care_agent",        care_agent_node)
graph.add_node("scheduling_agent",  scheduling_agent_node)

# START → entry_router (sticky check before anything else)
graph.add_conditional_edges(START, entry_router, {
    "orchestrator":      "orchestrator",
    "sales_agent":       "sales_agent",
    "support_agent":     "support_agent",
    "care_agent":        "care_agent",
    "scheduling_agent":  "scheduling_agent",
})

# orchestrator → specialist (fresh classification path)
graph.add_conditional_edges("orchestrator", route_from_orchestrator, {
    "sales":       "sales_agent",
    "support":     "support_agent",
    "care":        "care_agent",
    "scheduling":  "scheduling_agent",
    "unclear":     END,  # orchestrator already returned a clarification message
})

# support_agent and care_agent can hand off to scheduling in the same turn
graph.add_conditional_edges("support_agent", route_after_agent, {
    "scheduling_agent": "scheduling_agent",
    END: END,
})
graph.add_conditional_edges("care_agent", route_after_agent, {
    "scheduling_agent": "scheduling_agent",
    END: END,
})

# Sales and Scheduling are terminal per turn (no same-turn handoffs)
graph.add_edge("sales_agent",      END)
graph.add_edge("scheduling_agent", END)


# ---------------------------------------------------------------------------
# Compile with persistence
# ---------------------------------------------------------------------------

app_graph = graph.compile(checkpointer=checkpointer, store=store)


# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    from langchain_core.messages import HumanMessage

    tests = [
        ("smoke-0", "Do you have a wireless charger that works with a thick case?"),
        ("smoke-1", "My smart plug won't connect to WiFi, I've tried resetting it twice."),
        ("smoke-2", "I want a refund for order GM-10237, it stopped working after a week."),
    ]
    for thread_id, text in tests:
        cfg = {"configurable": {"thread_id": thread_id, "user_id": "smoke-tester"}}
        state = {"messages": [HumanMessage(content=text)], "trace_log": [], "unresolved_turns": 0, "awaiting_agent_response": False}
        result = app_graph.invoke(state, config=cfg)
        print(f"\n[{thread_id}] {text!r}")
        print(f"  → agent: {result.get('current_agent')}")
        print(f"  → awaiting: {result.get('awaiting_agent_response')}")
        print(f"  → reply: {result['messages'][-1].content[:120]}")
