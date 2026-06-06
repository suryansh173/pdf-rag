import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import chromadb

# ── Router ───────────────────────────────────────────────────────────────────
router = APIRouter()

# ── Shared clients ────────────────────────────────────────────────────────────
CHROMA_PATH      = "./chroma_store"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"   # lightweight English-only model

chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
embedder      = SentenceTransformer(EMBED_MODEL_NAME)

# ── Ollama config ─────────────────────────────────────────────────────────────
OLLAMA_URL   = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "llama3.2"   # change to "mistral" or "gemma2" if preferred

# ── Config ────────────────────────────────────────────────────────────────────
TOP_K      = 4
MIN_SCORE  = 0.30
MAX_TOKENS = 1024


# ── Schemas ───────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    query:  str
    doc_id: str


class SourceChunk(BaseModel):
    chunk: int
    page:  int
    score: float
    text:  str


class AskResponse(BaseModel):
    answer:  str
    sources: list[SourceChunk]
    doc_id:  str


# ── Helpers ───────────────────────────────────────────────────────────────────

def retrieve_chunks(query: str, doc_id: str) -> list[dict]:
    """
    Embed query and retrieve top-k similar chunks from ChromaDB.
    """
    try:
        collection = chroma_client.get_collection(name=doc_id)
    except Exception:
        raise HTTPException(
            status_code=404,
            detail=f"Document '{doc_id}' not found. Please upload it first."
        )

    query_vector = embedder.encode([query], show_progress_bar=False).tolist()[0]

    results = collection.query(
        query_embeddings=[query_vector],
        n_results=min(TOP_K, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for i, (doc, meta, dist) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    )):
        score = round(1 - (dist / 2), 4)
        if score < MIN_SCORE:
            continue
        chunks.append({
            "chunk": i + 1,
            "page":  meta.get("page", 0),
            "score": score,
            "text":  doc,
        })

    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="No relevant content found in the document for this query."
        )

    return chunks


def build_prompt(query: str, chunks: list[dict]) -> list[dict]:
    """
    Build messages list for Ollama chat endpoint.
    System prompt instructs the model to answer only from context.
    """
    context_block = "\n\n".join(
        f"[Chunk {c['chunk']} | Page {c['page']}]\n{c['text']}"
        for c in chunks
    )

    system_prompt = f"""You are a helpful document assistant.
Answer the user's question using ONLY the context chunks provided below.
Do NOT use any outside knowledge.
If the answer is not found in the context, clearly say "I could not find this in the document."
Keep answers concise, factual, and in English only.

CONTEXT:
{context_block}"""

    return [
        {"role": "system",  "content": system_prompt},
        {"role": "user",    "content": query},
    ]


def call_ollama(messages: list[dict]) -> str:
    """
    Call local Ollama server and return the response text.
    Make sure Ollama is running: `ollama serve`
    and the model is pulled: `ollama pull llama3.2`
    """
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model":    OLLAMA_MODEL,
                "messages": messages,
                "stream":   False,
                "options":  {"num_predict": MAX_TOKENS},
            },
            timeout=120,   # local models can be slow on first run
        )
        response.raise_for_status()
        return response.json()["message"]["content"].strip()

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Run `ollama serve` in a terminal first."
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Ollama took too long to respond. Try a smaller model."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest):
    """
    RAG query endpoint (English only, Ollama backend).

    Flow:
      1. Embed query with all-MiniLM-L6-v2
      2. Retrieve top-k chunks from ChromaDB
      3. Build context prompt
      4. Send to local Ollama (llama3.2)
      5. Return answer + source chunks

    Request body:
        query  — question in English
        doc_id — UUID returned by /upload
    """
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if not body.doc_id.strip():
        raise HTTPException(status_code=400, detail="doc_id is required.")

    # Step 1 — retrieve relevant chunks
    chunks = retrieve_chunks(body.query, body.doc_id)

    # Step 2 — build prompt
    messages = build_prompt(body.query, chunks)

    # Step 3 — call Ollama
    answer = call_ollama(messages)

    # Step 4 — build response
    sources = [
        SourceChunk(
            chunk=c["chunk"],
            page =c["page"],
            score=c["score"],
            text =c["text"],
        )
        for c in chunks
    ]

    return AskResponse(answer=answer, sources=sources, doc_id=body.doc_id)
