"""
Runtime tool used by the Support Agent to retrieve relevant KB context.

Loads the persisted Chroma collection built by ingestion/ingest_kb.py and
runs a similarity search, optionally narrowed by category metadata filter.

This is registered as a LangGraph/LangChain tool on the Support Agent —
the LLM decides when to call it based on the tool's docstring below.
"""

import os
from functools import lru_cache
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

EMBEDDING_MODEL_NAME = "models/gemini-embedding-001"
COLLECTION_NAME = "growmart_kb"


@lru_cache(maxsize=1)
def _get_vector_store() -> Chroma:
    persist_dir = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
    if not os.path.isdir(persist_dir):
        raise FileNotFoundError(
            f"No vector store found at {persist_dir}. "
            "Run `python -m backend.ingestion.ingest_kb` to build it."
        )
    embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL_NAME)
    return Chroma(
        persist_directory=persist_dir,
        embedding_function=embeddings,
        collection_name=COLLECTION_NAME,
    )


def search_kb(query: str, category: str | None = None, k: int = 3) -> str:
    """
    Search GrowMart's support knowledge base for content relevant to a
    customer's question.

    Use this tool whenever a customer asks about shipping, returns, refunds,
    warranty, order/account issues, product troubleshooting (SmartPlug,
    MagCharge, EchoBuds, SmartWatch Fit, LED Strip), pricing/membership, or
    how to contact support. Do not answer these topics from memory — always
    retrieve grounded context first.

    Args:
        query: The customer's question or a concise restatement of it.
        category: Optional filter, e.g. "Troubleshooting", "Returns & Refunds",
            "Shipping & Delivery", "Warranty", "Account & Orders",
            "Pricing & Membership", "General Support". Leave as None to
            search across all categories.
        k: Number of chunks to retrieve (default 3).

    Returns:
        A formatted string containing the retrieved passages, each tagged
        with its source article filename and title, so the agent (and the
        trace panel) can cite exactly where the answer came from.
    """
    vector_db = _get_vector_store()

    search_kwargs = {"k": k}
    if category:
        search_kwargs["filter"] = {"category": category}

    results = vector_db.similarity_search(query, **search_kwargs)

    if not results:
        return "No relevant articles found in the knowledge base for this query."

    formatted_chunks = []
    for doc in results:
        source = doc.metadata.get("source_file", "unknown")
        title = doc.metadata.get("title", "Untitled")
        formatted_chunks.append(
            f"[Source: {source} — \"{title}\"]\n{doc.page_content}"
        )

    return "\n\n---\n\n".join(formatted_chunks)


def get_retrieved_sources(query: str, category: str | None = None, k: int = 3) -> list[dict]:
    """
    Same retrieval as search_kb, but returns structured metadata instead of
    a formatted string — useful for emitting trace panel events that show
    exactly which articles were pulled (e.g. "Support Agent — searched KB,
    found: smartplug-wifi-troubleshooting.md").
    """
    vector_db = _get_vector_store()

    search_kwargs = {"k": k}
    if category:
        search_kwargs["filter"] = {"category": category}

    results = vector_db.similarity_search(query, **search_kwargs)

    return [
        {
            "source_file": doc.metadata.get("source_file", "unknown"),
            "title": doc.metadata.get("title", "Untitled"),
            "category": doc.metadata.get("category", "uncategorized"),
        }
        for doc in results
    ]