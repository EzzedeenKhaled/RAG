# Second Brain AI 🧠

A **PDF chat application** that lets you upload a PDF and ask questions about its contents using Retrieval-Augmented Generation (RAG).

---

## Features

- Upload PDFs and process their content
- Ask questions about the uploaded document
- Local vector database using **ChromaDB**
- Embeddings and LLM responses powered by **OpenRouter**
- Chat-style UI built with **Next.js + React**
- Fully containerized with **Docker Compose**

---

## Tech Stack

**Frontend:** Next.js, React, TailwindCSS v4

**Backend:** FastAPI, ChromaDB, PyPDF, LangChain Text Splitter, OpenRouter API

**AI Models:**

- `google/gemma-3-12b-it:free` — LLM
- `sentence-transformers/all-minilm-l6-v2` — Embeddings

---

## Environment Setup

Create a single `.env` file in the **project root** (next to `docker-compose.yml`):

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> Get your key at https://openrouter.ai/keys

This file is shared by both Docker Compose and the local setup. Do not create separate `.env` files in subfolders.

---

## Running with Docker (Recommended)

### Project Structure

```
my-rag/
├── app/
│   └── backend/
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── docker-compose.yml
├── Dockerfile
├── .env                  ← your API key
└── next.config.ts
```

### Start all services

```bash
docker compose up --build
```

On subsequent runs (no code changes):

```bash
docker compose up
```

Stop all services:

```bash
docker compose down
```

The app will be available at `http://localhost:3000`.

---

## Running Locally (Without Docker)

### 1. Start ChromaDB

```bash
pip install chromadb
chroma run --host 0.0.0.0 --port 8000
```

> **Note:** The default `CHROMA_HOST` is `chromadb` (the Docker service name). Change it to `localhost` when running outside Docker.

### 3. Start the backend

From `app/backend/`:

```bash
pip install -r requirements.txt
python '.\main.py'
```

Backend runs at `http://localhost:8002`.

### 4. Start the frontend

From the project root:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## How It Works

1. User uploads a PDF via the frontend
2. Backend extracts text using PyPDF
3. Text is split into overlapping chunks (800 chars, 100 overlap)
4. Chunks are embedded via OpenRouter and stored in ChromaDB
5. When a question is asked, it is embedded using the same model
6. Top 3 similar chunks are retrieved from ChromaDB
7. Context, question, and real-time web search results are sent to Gemma 3 12B via OpenRouter.
8. The AI streams the response back to the UI, providing grounded, up-to-date answers.

---

---

## Updated Features

Real-time streaming: Watch the AI construct answers word-by-word for a more responsive feel.

Integrated Web Search: Automatically fetches live data to supplement PDF context when needed.

---

## API Endpoints

### `POST /upload`

Uploads and processes a PDF.

Form data: `file` (PDF)

Response:

```json
{ "status": "success", "chunks_processed": 42 }
```

### `POST /ask`

Asks a question about the uploaded document.

Body:

```json
{ "question": "What problem does the paper solve?" }
```

Response:

```json
{ "answer": "..." }
```

---

## Notes

- Free OpenRouter models may have rate limits
- Only one document is supported at a time in the current implementation

---

## Future Improvements

- Multiple document support
- Authentication
- Cloud deployment

---

## License

MIT
