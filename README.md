# 📄 PDF-RAG — Ask Questions from Your PDF

A local, privacy-first Retrieval-Augmented Generation (RAG) application that lets you upload a PDF and ask questions about it in natural language. All processing happens on your machine — no data is sent to any external server.

---

## 🚀 Features

- Upload any PDF (up to 20 MB)
- Automatically extracts, chunks, and indexes text
- Semantic search using sentence embeddings
- Natural language Q&A powered by a local LLM via Ollama
- Source citations with page numbers and relevance scores
- Clean React frontend with drag-and-drop upload

---

## 🛠️ Tech Stack

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | REST API framework |
| PyMuPDF | PDF text extraction |
| sentence-transformers | Text embedding (`all-MiniLM-L6-v2`) |
| ChromaDB | Vector store for semantic search |
| Ollama | Local LLM inference |
| llama3.2 | Language model for answer generation |
| Uvicorn | ASGI server |

### Frontend
| Tool | Purpose |
|---|---|
| React | UI framework |
| Vite | Build tool and dev server |

---

## 📁 Project Structure

```
PDF-RAG/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── upload.py        # PDF upload, chunking, embedding, indexing
│   ├── ask.py           # RAG query endpoint
│   ├── language.py      # Language detection (English)
│   ├── requirements.txt # Python dependencies
│   └── chroma_store/    # Persistent vector database (auto-created)
└── frontend/
    ├── src/
    │   ├── App.jsx           # Root component
    │   ├── PDFUploader.jsx   # Drag-and-drop PDF upload UI
    │   ├── ChatInterface.jsx # Chat UI with source citations
    │   └── CitationsPanel.jsx# Citations sidebar
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.12
- Node.js 18+
- [Ollama](https://ollama.com) installed

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/pdf-rag.git
cd pdf-rag
```

### 2. Backend Setup
```bash
cd backend
python -m venv pdf-rag-env
# Windows
.\pdf-rag-env\Scripts\activate
# macOS/Linux
source pdf-rag-env/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Pull the LLM Model
```bash
ollama pull llama3.2
```

---

## ▶️ Running the Project

Open **three terminals** and run in this order:

**Terminal 1 — Ollama:**
```bash
ollama serve
```

**Terminal 2 — Backend:**
```bash
cd backend
.\pdf-rag-env\Scripts\activate   # Windows
uvicorn main:app --reload
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload and index a PDF |
| POST | `/ask` | Ask a question about an uploaded PDF |
| POST | `/detect-language` | Detect language of text |
| GET | `/health` | Health check |
| GET | `/docs` | Interactive API docs (Swagger) |

---

## 🧠 How It Works

```
User uploads PDF
      ↓
PyMuPDF extracts text page by page
      ↓
Text is split into overlapping chunks (500 chars, 50 overlap)
      ↓
Each chunk is embedded using all-MiniLM-L6-v2
      ↓
Embeddings stored in ChromaDB (cosine similarity)
      ↓
User asks a question
      ↓
Question is embedded → top-4 similar chunks retrieved
      ↓
Chunks + question sent to Ollama (llama3.2)
      ↓
Answer returned with source page citations
```

---

## 📦 Requirements

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-multipart==0.0.9
PyMuPDF==1.24.3
sentence-transformers==2.7.0
chromadb==0.5.5
requests==2.31.0
pydantic==2.7.1
numpy<2.0
```

---

## 📚 References & Citations

- **Lewis et al. (2020)** — *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. Facebook AI Research. https://arxiv.org/abs/2005.11401

- **Reimers & Gurevych (2019)** — *Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks*. https://arxiv.org/abs/1908.10084 — basis for the `sentence-transformers` library and `all-MiniLM-L6-v2` model used in this project.

- **ChromaDB** — Open-source vector database. https://www.trychroma.com

- **Ollama** — Run large language models locally. https://ollama.com

- **PyMuPDF (fitz)** — Python bindings for MuPDF, used for PDF text extraction. https://pymupdf.readthedocs.io

- **FastAPI** — Modern, fast web framework for building APIs with Python. https://fastapi.tiangolo.com

- **Meta AI (2024)** — *Llama 3.2*. The language model used for answer generation. https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/

---

## 📝 License

MIT License — free to use, modify, and distribute.