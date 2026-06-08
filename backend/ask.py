from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from groq import Groq
import chromadb
import os

# Router
router = APIRouter()

# Shared clients
CHROMA_PATH      = "./chroma_store"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
embedder      = SentenceTransformer(EMBED_MODEL_NAME)

# Groq config
GROQ_MODEL  = "llama-3.1-8b-instant"   # free, fast
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Config
TOP_K      = 4
MIN_SCORE  = 0.30
MAX_TOKENS = 1024


# Schemas

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


# Helpers

def retrieve_chunks(query: str, doc_id: str) -> list[dict]:
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
            detail="No relevant content found for this query."
        )

    return chunks


def build_prompt(query: str, chunks: list[dict]) -> list[dict]:
    context_block = "\n\n".join(
        f"[Chunk {c['chunk']} | Page {c['page']}]\n{c['text']}"
        for c in chunks
    )

    system_prompt = f"""You are a helpful document assistant.
Answer the user's question using ONLY the context chunks provided below.
Do NOT use any outside knowledge.
If the answer is not found in the context, say "I could not find this in the document."
Keep answers concise, factual, and in English only.

CONTEXT:
{context_block}"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": query},
    ]


def call_groq(messages: list[dict]) -> str:
    try:
        response = groq_client.chat.completions.create(
            model      = GROQ_MODEL,
            messages   = messages,
            max_tokens = MAX_TOKENS,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")


# Route

@router.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if not body.doc_id.strip():
        raise HTTPException(status_code=400, detail="doc_id is required.")

    chunks   = retrieve_chunks(body.query, body.doc_id)
    messages = build_prompt(body.query, chunks)
    answer   = call_groq(messages)

    sources = [
        SourceChunk(chunk=c["chunk"], page=c["page"], score=c["score"], text=c["text"])
        for c in chunks
    ]

    return AskResponse(answer=answer, sources=sources, doc_id=body.doc_id)