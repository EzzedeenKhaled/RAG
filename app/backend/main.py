import os
import io
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# 1. Initialize the OpenRouter Client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local Vector DB
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection("pdf_docs")

class Question(BaseModel):
    question: str

# -----------------------------
# OpenRouter Logic
# -----------------------------

def get_openrouter_embeddings(texts: list[str]):
    """Uses the OpenAI client style to get embeddings from OpenRouter"""
    response = client.embeddings.create(
        model="sentence-transformers/all-minilm-l6-v2",
        input=texts,
        encoding_format="float"
    )
    # Extract the list of embedding vectors
    return [item.embedding for item in response.data]

def ask_gemma_with_context(context: str, user_query: str):
    # Merge system instructions and user query into one 'user' message
    combined_prompt = (
        f"INSTRUCTIONS: You are a helpful assistant. Answer the question using ONLY the context below. "
        f"If the answer isn't there, say you don't know.\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"USER QUESTION: {user_query}"
    )

    completion = client.chat.completions.create(
        model="google/gemma-3-12b-it:free",
        messages=[
            {"role": "user", "content": combined_prompt}
        ]
    )
    return completion.choices[0].message.content

# -----------------------------
# Endpoints
# -----------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # 1. Parse PDF
        pdf_bytes = await file.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = "".join([page.extract_text() or "" for page in reader.pages])

        # 2. Chunk Text
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        chunks = splitter.split_text(text)

        # 3. Get Embeddings via OpenRouter
        embeddings = get_openrouter_embeddings(chunks)

        # 4. Add to ChromaDB
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=[f"{file.filename}_{i}" for i in range(len(chunks))]
        )
        return {"status": "success", "chunks_processed": len(chunks)}
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(question: Question):
    try:
        # 1. Embed user question
        q_emb = get_openrouter_embeddings([question.question])[0]

        # 2. Search PDF Chunks
        results = collection.query(query_embeddings=[q_emb], n_results=3)
        context = "\n\n".join(results["documents"][0])

        # 3. Get Answer from Gemma
        answer = ask_gemma_with_context(context, question.question)
        return {"answer": answer}
        # return {"answer": "answer"}
    except Exception as e:
        print(f"Ask error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process question")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)