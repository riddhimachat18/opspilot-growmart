"""
One-time (or on-demand) ingestion script.

Reads all markdown articles from kb/, parses their YAML frontmatter
(title, category, tags), chunks the body text, embeds the chunks using
a local open-source embedding model (no API key required), and persists
everything into a Chroma vector store on disk.

Run manually whenever KB content changes:
    python -m ingestion.ingest_kb

Requires:
    pip install langchain langchain-chroma langchain-huggingface \
                langchain-text-splitters python-frontmatter sentence-transformers
"""

import os
import frontmatter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

# --- Config -----------------------------------------------------------

KB_DIR = os.path.join(os.path.dirname(__file__), "..", "kb")
PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_db")

# Small, fast, fully local model — no API key, ~80MB download on first run.
# Good enough quality for a 24-article demo KB; swap for a larger
# sentence-transformers model later if you scale to thousands of docs.
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100


def load_articles(kb_dir: str) -> list[Document]:
    """Read every .md file in kb_dir, parse frontmatter, return LangChain Documents."""
    documents = []

    if not os.path.isdir(kb_dir):
        raise FileNotFoundError(f"KB directory not found: {kb_dir}")

    md_files = sorted(f for f in os.listdir(kb_dir) if f.endswith(".md"))
    if not md_files:
        raise ValueError(f"No markdown files found in {kb_dir}")

    for filename in md_files:
        filepath = os.path.join(kb_dir, filename)
        post = frontmatter.load(filepath)  # splits YAML frontmatter from body

        metadata = {
            "source_file": filename,
            "title": post.get("title", filename),
            "category": post.get("category", "uncategorized"),
            # Chroma metadata values must be str/int/float/bool, so join list tags
            "tags": ", ".join(post.get("tags", [])) if isinstance(post.get("tags"), list) else str(post.get("tags", "")),
        }

        documents.append(Document(page_content=post.content, metadata=metadata))

    return documents


def chunk_documents(documents: list[Document]) -> list[Document]:
    """Split article bodies into overlapping chunks, preserving parent metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(documents)


def build_vector_store(chunked_docs: list[Document]) -> Chroma:
    """Embed chunks with a local model and persist to disk as a Chroma collection."""
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

    vector_db = Chroma.from_documents(
        documents=chunked_docs,
        embedding=embeddings,
        persist_directory=PERSIST_DIR,
        collection_name="growmart_kb",
    )
    return vector_db


def run_ingestion():
    print(f"Loading articles from {KB_DIR} ...")
    articles = load_articles(KB_DIR)
    print(f"Loaded {len(articles)} articles.")

    chunked = chunk_documents(articles)
    print(f"Split into {len(chunked)} chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}).")

    print("Embedding and persisting to Chroma (this may take a minute on first run)...")
    build_vector_store(chunked)
    print(f"Done. Vector store persisted at: {PERSIST_DIR}")


if __name__ == "__main__":
    run_ingestion()