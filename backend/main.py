from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from upload   import router as upload_router
from ask      import router as ask_router
from language import router as language_router

#App
app = FastAPI(
    title       = "RAG API",
    description = "English PDF Q&A using RAG and Ollama",
    version     = "1.0.0",
)

#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

#Routers
app.include_router(upload_router)
app.include_router(ask_router)
app.include_router(language_router)


@app.get("/")
def root():
    return {"status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok", "ollama": "http://localhost:11434"}
