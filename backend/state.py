from typing import TypedDict, Literal, Annotated, Optional
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from langchain_core.messages import AnyMessage


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]  # append-only, checkpointer-friendly

    # Classification result set by orchestrator_node
    message_type: Literal["sales", "support", "care", "scheduling", "unclear"]

    # Which agent node is currently "owning" the conversation turn
    current_agent: str

    # ── Sticky routing ────────────────────────────────────────────────────────
    # True while an agent is mid-task and waiting for the user's next reply
    # (e.g. care_agent asked "what's your order ID?").
    # When True, graph.py's entry_router skips the orchestrator entirely and
    # routes the next user message straight back to current_agent.
    # Each agent node is responsible for setting this accurately on return:
    #   True  → I asked the user something and need their next reply
    #   False → I'm done with this task (or handing off), re-classify next turn
    awaiting_agent_response: bool

    # Set by support_agent / care_agent to hand off to scheduling_agent
    # within the same turn. Cleared by scheduling_agent on its return.
    route_to: Optional[str]

    # How many consecutive turns the support agent could not resolve
    unresolved_turns: int

    # Rolling plain-text summary of messages that have been trimmed from
    # state via RemoveMessage. Prepended to classifier context so the
    # orchestrator retains long-term conversational memory even after
    # message history is pruned.
    conversation_summary: str

    # Running list of structured trace events emitted by every node,
    # streamed to the frontend via main.py
    trace_log: list[dict]


class MessageSchema(BaseModel):
    message_type: Literal["sales", "support", "care", "scheduling", "unclear"] = Field(
        description="The classified category matching the user's explicit intent."
    )
