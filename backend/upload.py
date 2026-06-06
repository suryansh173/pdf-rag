import uuid
import fitz  # PyMuPDF
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sentence_transformers import SentenceTransformer
import chromadb

#Router
router = APIRouter()

#ChromaDB client
CHROMA_PATH = "./chroma_store"
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

#English-only embedding model (fast + lightweight) 
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
embedder = SentenceTransformer(EMBED_MODEL_NAME)

#Config
CHUNK_SIZE    = 500
CHUNK_OVERLAP = 50
MAX_FILE_MB   = 20


#Helpers 

def validate_pdf(file: UploadFile, content: bytes) -> None:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    mb = len(content) / (1024 * 1024)
    if mb > MAX_FILE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_MB} MB limit.")


def extract_text_from_pdf(content: bytes) -> list[dict]:
    """Extract text page by page using PyMuPDF."""
    pages = []
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        for page_num in range(len(doc)):
            text = doc[page_num].get_text("text").strip()
            if text:
                pages.append({"page": page_num + 1, "text": text})
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {str(e)}")

    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No extractable text found. PDF may be scanned/image-only."
        )
    return pages


def chunk_pages(pages: list[dict]) -> list[dict]:
    """Split pages into overlapping chunks of CHUNK_SIZE characters."""
    chunks = []
    for page in pages:
        text  = page["text"]
        start = 0
        while start < len(text):
            chunk_text = text[start:start + CHUNK_SIZE].strip()
            if chunk_text:
                chunks.append({"text": chunk_text, "page": page["page"]})
            start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def embed_and_store(chunks: list[dict], doc_id: str, doc_name: str) -> None:
    """Embed chunks and store in ChromaDB collection keyed by doc_id."""
    collection = chroma_client.get_or_create_collection(
        name     = doc_id,
        metadata = {"doc_name": doc_name, "hnsw:space": "cosine"},
    )
    texts   = [c["text"] for c in chunks]
    pages   = [c["page"] for c in chunks]
    ids     = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    vectors = embedder.encode(texts, show_progress_bar=False).tolist()

    collection.add(
        ids        = ids,
        embeddings = vectors,
        documents  = texts,
        metadatas  = [{"page": p, "doc_id": doc_id} for p in pages],
    )


#Route

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF, extract text, chunk it, embed with all-MiniLM-L6-v2,
    and store in ChromaDB. Returns doc_id for subsequent /ask calls.
    """
    content  = await file.read()
    validate_pdf(file, content)

    doc_id   = str(uuid.uuid4())
    doc_name = file.filename or "document.pdf"

    pages  = extract_text_from_pdf(content)
    chunks = chunk_pages(pages)

    if not chunks:
        raise HTTPException(status_code=422, detail="Document produced no text chunks.")

    embed_and_store(chunks, doc_id, doc_name)

    return JSONResponse({
        "doc_id":  doc_id,
        "name":    doc_name,
        "pages":   len(pages),
        "chunks":  len(chunks),
        "model":   EMBED_MODEL_NAME,
        "status":  "indexed",
    })
