# Second Brain AI 🧠

Second Brain AI is a simple **PDF chat application** that allows you to upload a PDF and ask questions about its contents.
The system extracts text from the document, stores embeddings in a vector database, and uses an LLM to answer questions based on the document context.

---

# Features

- Upload PDFs and process their content
- Ask questions about the uploaded document
- Retrieval-Augmented Generation (RAG)
- Local vector database using **ChromaDB**
- Embeddings and LLM responses powered by **OpenRouter**
- Chat-style UI built with **Next.js + React**

---

# Tech Stack

Frontend:

- Next.js
- React
- TailwindCSS

Backend:

- FastAPI
- ChromaDB
- PyPDF
- LangChain Text Splitter
- OpenRouter API (LLM + embeddings)

AI Models:

- `google/gemma-3-12b-it:free` (LLM)
- `sentence-transformers/all-minilm-l6-v2` (embeddings)

---

# 1. Get an OpenRouter API Key

1. Go to
   https://openrouter.ai

2. Create an account.

3. Open the API Keys page:
   https://openrouter.ai/keys

4. Create a new key.

5. Copy the key.

---

# 2. Backend Setup (FastAPI)

### Install Python dependencies

Recommended Python version: **3.10+**

```
pip install fastapi uvicorn python-dotenv pypdf chromadb langchain-text-splitters openai
```

---

### Create `.env`

In the backend folder create:

```
.env
```

Add your OpenRouter API key:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

### Start the backend

```
python main.py
```

or

```
uvicorn main:app --reload --port 8002
```

Backend will run at:

```
http://localhost:8002
```

---

# 3. Frontend Setup (Next.js)

Install dependencies:

```
npm install
```

Run the development server:

```
npm run dev
```

Frontend will run at:

```
http://localhost:3000
```

---

# 4. How the System Works

1. User uploads a PDF.
2. Backend extracts text from the document.
3. Text is split into chunks.
4. Each chunk is converted into an embedding.
5. Embeddings are stored in **ChromaDB**.
6. When a question is asked:
   - The question is embedded
   - Similar chunks are retrieved
   - Context is sent to the LLM

7. The AI generates an answer using the retrieved context.

This approach is called **Retrieval-Augmented Generation (RAG)**.

---

# Example Workflow

1. Upload a research paper PDF
2. Ask:

```
What problem does the paper solve?
```

3. The AI searches the document and answers based only on the PDF content.

---

# API Endpoints

### Upload PDF

```
POST /upload
```

Form Data:

```
file: pdf
```

---

# Notes

- The vector database runs **locally in memory**.
- Restarting the backend clears stored documents.
- The free OpenRouter models may have **rate limits**.

---

# Future Improvements

- Persistent vector database
- Multiple document support
- Streaming responses
- Better chat UI
- Authentication
- Deployment (Docker + Cloud)

---

# License

MIT
