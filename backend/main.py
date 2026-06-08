from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from upload   import router as upload_router
from ask      import router as ask_router
from language import router as language_router

app = FastAPI(
    title       = "RAG API",
    description = "PDF Q&A using RAG and Groq",
    version     = "2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],   # tighten this after deployment
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(upload_router)
app.include_router(ask_router)
app.include_router(language_router)


@app.get("/")
def root():
    return {"status": "running", "llm": "groq", "model": "llama-3.1-8b-instant"}


@app.get("/health")
def health():
    return {"status": "ok", "llm": "groq"}