# PDF RAG — Retrieval-Augmented Generation for PDF Documents

A full-stack application that allows users to upload PDF documents and ask questions about them using natural language. The system retrieves relevant chunks from the document and uses a large language model to generate accurate, context-aware answers.

Live Demo: https://pdf-rag-navy.vercel.app  
API Docs: https://44-215-49-95.nip.io/docs

---

## What it does

1. User uploads a PDF document
2. The backend extracts text, splits it into overlapping chunks, and embeds each chunk using a sentence transformer model
3. Embeddings are stored in a ChromaDB vector database
4. When the user asks a question, the query is embedded and the most relevant chunks are retrieved using cosine similarity
5. Retrieved chunks are passed as context to a large language model which generates the final answer
6. The answer is returned along with source citations showing which chunks and pages were used

---

## Architecture

### Local version (local-version branch)

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

### Cloud version (cloud-deploy branch — default)

```
React Frontend (Vercel)
        |
FastAPI Backend (AWS EC2 t3.micro)
        |-- Caddy reverse proxy (HTTPS via Let's Encrypt)
        |-- systemd service (auto-restart on crash/reboot)
        |-- Elastic IP (permanent static IP)
        |
   ChromaDB (persistent on EC2 disk)
        |
   Groq API — LLaMA 3.1-8b-instant (cloud LLM)
        |
   AWS S3 (PDF object storage)
```

---

## Tech Stack

### Backend
- Python 3.12
- FastAPI (https://fastapi.tiangolo.com) — REST API framework with automatic OpenAPI docs
- PyMuPDF (https://pymupdf.readthedocs.io) — PDF text extraction page by page
- Sentence Transformers (https://www.sbert.net) — all-MiniLM-L6-v2 model for text embeddings
- ChromaDB (https://www.trychroma.com) — open source vector database for similarity search
- Groq API (https://console.groq.com) — cloud LLM inference using LLaMA 3.1-8b-instant
- Ollama (https://ollama.com) — local LLM runtime used in local-version branch
- boto3 (https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) — AWS SDK for Python
- Uvicorn (https://www.uvicorn.org) — ASGI server for running FastAPI
- Pydantic (https://docs.pydantic.dev) — data validation and schema definition

### Frontend
- React 18 (https://react.dev) — UI library
- Vite (https://vitejs.dev) — frontend build tool and dev server
- Vanilla CSS — no external UI library used

### Cloud Infrastructure (AWS)
- EC2 t3.micro — backend server (Ubuntu 24.04 LTS)
- S3 — PDF file object storage
- IAM — roles and permission policies
- Elastic IP — permanent static public IP address
- Security Groups — inbound/outbound network access control

### Other Services
- Caddy (https://caddyserver.com) — reverse proxy with automatic HTTPS via Let's Encrypt
- nip.io (https://nip.io) — free wildcard DNS for IP-based HTTPS
- Vercel (https://vercel.com) — frontend hosting with automatic deployments from GitHub
- Groq (https://groq.com) — free LLM API used as cloud replacement for local Ollama

---

## Branches

| Branch | Description | Status |
|--------|-------------|--------|
| cloud-deploy (default) | AWS deployment with EC2, S3, Groq API, HTTPS | Live at pdf-rag-navy.vercel.app |
| local-version | Local setup using Ollama and local ChromaDB | Run on your machine |

---

## Project Structure

```
pdf-rag/
├── backend/
│   ├── main.py           # FastAPI app, CORS middleware, router registration
│   ├── upload.py         # PDF upload, text extraction, chunking, embedding, S3 storage
│   ├── ask.py            # Query embedding, ChromaDB retrieval, Groq LLM call, response
│   ├── language.py       # Language detection utility
│   └── requirements.txt  # Python dependencies
├── frontend/
│   └── src/
│       ├── App.jsx            # Root component, manages upload and chat state
│       ├── PDFUploader.jsx    # Drag and drop PDF upload UI with progress bar
│       ├── ChatInterface.jsx  # Chat UI with message history and source citations
│       └── CitationsPanel.jsx # Source chunk display with relevance scores
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /upload | Upload PDF, extract text, embed chunks, store in ChromaDB and S3 |
| POST | /ask | Submit question, retrieve relevant chunks, get LLM answer |
| POST | /detect-language | Detect language of input text |
| GET | /health | Health check |
| GET | /docs | Interactive Swagger UI |

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

RAG (Retrieval-Augmented Generation) was introduced in the paper "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (Lewis et al., 2020, https://arxiv.org/abs/2005.11401). The core idea is to retrieve relevant documents before generating an answer, so the LLM is grounded in real source material rather than relying solely on its training data.

### 1. Document ingestion

- PDF is parsed page by page using PyMuPDF
- Each page is split into chunks of 500 characters with 50 character overlap
- Overlap ensures context is not lost at chunk boundaries — a technique described in LangChain's chunking documentation (https://python.langchain.com/docs/concepts/text_splitters)
- Each chunk is embedded using all-MiniLM-L6-v2, a lightweight sentence transformer model from the SBERT project (https://www.sbert.net/docs/sentence_transformer/pretrained_models.html) that produces 384-dimensional vectors
- Embeddings are stored in ChromaDB using cosine similarity space
- Original PDF is uploaded to AWS S3 for persistent storage

### 2. Query processing

- User query is embedded using the same all-MiniLM-L6-v2 model to ensure vectors are in the same space
- Top 4 most similar chunks are retrieved from ChromaDB using approximate nearest neighbour search via the HNSW algorithm (https://www.pinecone.io/learn/series/faiss/hnsw)
- Chunks below a minimum relevance score of 0.30 are filtered out to avoid irrelevant context
- Retrieved chunks are formatted into a context block with page references
- A system prompt instructs the LLM to answer only from the provided context — a standard RAG prompting technique
- Groq API calls LLaMA 3.1-8b-instant (Meta, https://ai.meta.com/blog/meta-llama-3) to generate the final answer
- Answer is returned with source citations for transparency and verification

---

## Running locally (local-version branch)

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Ollama installed (https://ollama.com/download)

### Backend setup
```bash
git clone -b local-version https://github.com/suryansh173/pdf-rag.git
cd pdf-rag/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
ollama serve
ollama pull llama3.2
uvicorn main:app --reload
```

### Frontend setup
```bash
cd pdf-rag/frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Running cloud version (cloud-deploy branch)

### Prerequisites
- AWS account with EC2, S3, IAM configured
- Groq API key — free at https://console.groq.com

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
Update API URLs in PDFUploader.jsx and ChatInterface.jsx to your EC2 address, then connect your GitHub repository to Vercel and deploy.

---

## Cloud infrastructure setup

- EC2 t3.micro instance on Ubuntu 24.04 LTS in us-east-1 region
- Elastic IP allocated and associated for permanent public IP
- IAM role with AmazonS3FullAccess and AmazonSSMManagedInstanceCore attached to EC2
- S3 bucket created in us-east-1 with public access configured for uploads
- Security group inbound rules: SSH (22), HTTP (80), HTTPS (443), FastAPI (8000)
- systemd service configured for auto-start on boot and auto-restart on crash
- 2GB swap memory added to handle sentence-transformers memory requirements on t3.micro
- Caddy configured as reverse proxy with automatic SSL certificate from Let's Encrypt
- nip.io used for free DNS resolution mapping EC2 IP to a domain for HTTPS

---

## Known limitations

- ChromaDB data is stored on EC2 disk — if instance is terminated, vector data is lost
- No user authentication — anyone with the link can upload and query documents
- nip.io is a free community service with no uptime guarantee
- t3.micro has 1GB RAM — large PDFs may be slow to process due to embedding generation
- No document history — each session is independent

---

## Future improvements

- Add user authentication with JWT tokens
- Migrate ChromaDB to a managed vector database such as Pinecone or Weaviate
- Add support for querying multiple documents simultaneously
- Set up CI/CD pipeline with GitHub Actions
- Add CloudWatch monitoring and alerting
- Replace nip.io with a custom domain and dedicated SSL certificate
- Add Docker and docker-compose for easier local setup

---

## References

- Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. https://arxiv.org/abs/2005.11401
- Reimers, N. and Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. https://arxiv.org/abs/1908.10084
- Meta AI. (2024). Introducing Meta Llama 3. https://ai.meta.com/blog/meta-llama-3
- ChromaDB Documentation. https://docs.trychroma.com
- FastAPI Documentation. https://fastapi.tiangolo.com
- Malkov, Y. and Yashunin, D. (2018). Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs. https://arxiv.org/abs/1603.09320

---

## Acknowledgements

This project was built as part of a self-directed learning journey to understand 
production ML systems and cloud deployment from scratch as a recent graduate.

Special thanks to the following open source projects and communities that made 
this possible:

- The Sentence Transformers team (Nils Reimers, Iryna Gurevych) for the 
  all-MiniLM-L6-v2 model used for semantic embeddings
- The ChromaDB team for building an accessible open source vector database
- The FastAPI team (Sebastian Ramirez) for the excellent Python API framework
- The Groq team for providing free and fast LLM inference API
- The Caddy project for automatic HTTPS that simplified production deployment
- Claude (Anthropic) for architecture guidance, debugging assistance, and 
  deployment troubleshooting

This project intentionally avoids high-level RAG frameworks like LangChain to 
build the retrieval pipeline from first principles — including manual chunking, 
embedding, similarity search, and prompt construction — to develop a deeper 
understanding of how RAG systems work internally.
