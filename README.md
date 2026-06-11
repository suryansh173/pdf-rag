# PDF RAG — Retrieval-Augmented Generation for PDF Documents

A full-stack application that allows users to upload PDF documents and ask questions about them using natural language. The system retrieves relevant chunks from the document and uses a large language model to generate accurate, context-aware answers.

Live Demo: https://pdf-rag-navy.vercel.app

---

## What it does

1. User uploads a PDF document
2. The backend extracts text, splits it into overlapping chunks, and embeds each chunk using a sentence transformer model
3. Embeddings are stored in a ChromaDB vector database
4. When the user asks a question, the query is embedded and the most relevant chunks are retrieved
5. Retrieved chunks are passed as context to a large language model which generates the final answer
6. The answer is returned along with source citations showing which chunks and pages were used

---

## Architecture

### Local version (main branch)

```
React Frontend (localhost:5173)
        |
FastAPI Backend (localhost:8000)
        |
   ChromaDB (local vector store)
        |
   Ollama + LLaMA 3.2 (local LLM)
        |
   PDF files (local disk)
```

### Cloud version (cloud-deploy branch)

```
React Frontend (Vercel)
        |
FastAPI Backend (AWS EC2 t3.micro)
        |-- Caddy reverse proxy (HTTPS)
        |-- systemd service (auto-restart)
        |-- Elastic IP (permanent)
        |
   ChromaDB (persistent on EC2)
        |
   Groq API (LLaMA 3.1-8b-instant)
        |
   AWS S3 (PDF object storage)
```

---

## Tech Stack

### Backend
- Python 3.12
- FastAPI — REST API framework
- PyMuPDF — PDF text extraction
- Sentence Transformers (all-MiniLM-L6-v2) — text embeddings
- ChromaDB — vector database for similarity search
- Groq API (cloud) / Ollama (local) — LLM inference
- boto3 — AWS S3 SDK
- Uvicorn — ASGI server

### Frontend
- React 18
- Vite — build tool
- Vanilla CSS — no UI library

### Cloud Infrastructure (AWS)
- EC2 t3.micro — backend server
- S3 — PDF file storage
- IAM — roles and permissions
- Elastic IP — permanent static IP address
- Security Groups — network access control
- Caddy — reverse proxy with automatic HTTPS via Let's Encrypt
- systemd — service management and auto-restart

### Deployment
- Vercel — frontend hosting
- nip.io — free DNS for HTTPS without a custom domain

---

## Project Structure

```
pdf-rag/
├── backend/
│   ├── main.py           # FastAPI app, CORS, router registration
│   ├── upload.py         # PDF upload, text extraction, chunking, embedding, S3 storage
│   ├── ask.py            # Query embedding, ChromaDB retrieval, LLM call, response
│   ├── language.py       # Language detection utility
│   └── requirements.txt  # Python dependencies
├── frontend/
│   └── src/
│       ├── App.jsx           # Root component, upload/chat state
│       ├── PDFUploader.jsx   # Drag and drop PDF upload with progress bar
│       ├── ChatInterface.jsx # Chat UI with message history and source citations
│       └── CitationsPanel.jsx # Source chunk display panel
├── .gitignore
└── README.md
```

---

## Branches

| Branch | Description | Status |
|--------|-------------|--------|
| main | Local setup using Ollama and local ChromaDB | Run locally |
| cloud-deploy | AWS deployment with EC2, S3, Groq API, HTTPS | Live |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /upload | Upload PDF, extract text, embed chunks, store in ChromaDB and S3 |
| POST | /ask | Submit question, retrieve relevant chunks, get LLM answer |
| POST | /detect-language | Detect language of input text |
| GET | /health | Health check |
| GET | /docs | Interactive API documentation (Swagger UI) |

### Upload request
```
Content-Type: multipart/form-data
Body: file (PDF, max 20MB)
```

### Upload response
```json
{
  "doc_id": "uuid-string",
  "name": "filename.pdf",
  "pages": 10,
  "chunks": 48,
  "model": "all-MiniLM-L6-v2",
  "s3_key": "uploads/uuid/filename.pdf",
  "status": "indexed"
}
```

### Ask request
```json
{
  "query": "What is the refund policy?",
  "doc_id": "uuid-string"
}
```

### Ask response
```json
{
  "answer": "Refunds must be requested within 30 days...",
  "sources": [
    {
      "chunk": 1,
      "page": 4,
      "score": 0.91,
      "text": "All refund requests must be submitted..."
    }
  ],
  "doc_id": "uuid-string"
}
```

---

## How RAG works in this project

### 1. Document ingestion (upload)
- PDF is parsed page by page using PyMuPDF
- Each page is split into chunks of 500 characters with 50 character overlap
- Overlap ensures context is not lost at chunk boundaries
- Each chunk is embedded using all-MiniLM-L6-v2 (384-dimensional vectors)
- Embeddings and metadata (page number, doc_id) are stored in ChromaDB using cosine similarity space
- Original PDF is uploaded to S3 for persistent storage

### 2. Query processing (ask)
- User query is embedded using the same all-MiniLM-L6-v2 model
- Top 4 most similar chunks are retrieved from ChromaDB using cosine similarity
- Chunks below a minimum score of 0.30 are filtered out
- Retrieved chunks are formatted into a context block with page references
- A system prompt instructs the LLM to answer only from the provided context
- Groq API (LLaMA 3.1-8b-instant) generates the final answer
- Answer is returned with source citations for transparency

---

## Running locally (main branch)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Ollama installed and running
- LLaMA 3.2 model pulled

### Backend setup
```bash
git clone https://github.com/suryansh173/pdf-rag.git
cd pdf-rag/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend setup
```bash
cd pdf-rag/frontend
npm install
npm run dev
```

### Start Ollama
```bash
ollama serve
ollama pull llama3.2
```

Open http://localhost:5173 in your browser.

---

## Running cloud version (cloud-deploy branch)

### Prerequisites
- AWS account with EC2, S3, IAM configured
- Groq API key (free at console.groq.com)

### Backend setup on EC2
```bash
git clone -b cloud-deploy https://github.com/suryansh173/pdf-rag.git
cd pdf-rag/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export GROQ_API_KEY="your_key_here"
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend deployment
Update API URLs in PDFUploader.jsx and ChatInterface.jsx to point to your EC2 address, then deploy to Vercel by connecting your GitHub repository.

---

## Cloud infrastructure setup summary

- EC2 t3.micro instance on Ubuntu 24.04 LTS
- Elastic IP allocated and associated with instance
- IAM role with AmazonS3FullAccess and AmazonSSMManagedInstanceCore attached to EC2
- S3 bucket created in us-east-1 region
- Security group inbound rules: SSH (22), HTTP (80), HTTPS (443), FastAPI (8000)
- systemd service configured for auto-start and auto-restart of FastAPI
- Caddy installed as reverse proxy with automatic SSL certificate from Let's Encrypt via nip.io domain
- Swap memory (2GB) added to handle sentence-transformers memory requirements on t3.micro

---

## Known limitations

- ChromaDB data is stored on EC2 disk — if instance is terminated, vector data is lost
- nip.io domain is a free service with no SLA guarantee
- t3.micro has 1GB RAM — large PDFs may be slow to process
- Uploaded PDFs are session-based — no user accounts or document history

---

## Future improvements

- Add user authentication
- Migrate ChromaDB to a managed vector database
- Add support for multiple documents per session
- Set up CI/CD pipeline with GitHub Actions and AWS CodeDeploy
- Add CloudWatch monitoring and alerts
- Support multilingual documents

---

## Author

Suryansh Pratap Singh  
suryanshpratapsingh528@gmail.com  
https://github.com/suryansh173