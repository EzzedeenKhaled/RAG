import os
import io
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from openai import OpenAI
from dotenv import load_dotenv
from tavily import AsyncTavilyClient

load_dotenv()

app = FastAPI()

# 1. Initialize the OpenRouter Client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

tavily_client = AsyncTavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local Vector DB
chroma_client = chromadb.HttpClient(
    host=os.getenv("CHROMA_HOST", "chromadb"),
    port=int(os.getenv("CHROMA_PORT", 8000))
)
collection = chroma_client.get_or_create_collection(name="pdf_docs")

class Question(BaseModel):
    question: str
    web_search: bool = False  # New field to indicate if web search is needed
# -----------------------------
# OpenRouter Logic
# -----------------------------

async def perform_web_search(user_question: str):
    rewritten_query = rewrite_question(user_question)
    response = await tavily_client.search(
        query=f"{rewritten_query}",
        include_answer="basic",
        search_depth="basic",
        max_results=1
    )
    return response['answer']

def rewrite_question(question: str):
    """Rewrites the question to be more suitable for web search"""
    prompt = f"""
    Extract ONLY the web-searchable parts from the user's question as a single search query.

    Rules:
    1. Ignore any parts that reference documents, files, PDFs, uploads, or personal data (grades, GPA, names, etc.).
    2. Extract only real-world facts that can be searched on the internet (locations, institutions, definitions, etc.).
    3. If the question has multiple parts, combine only the searchable parts into ONE query.
    4. Output only the search query, no explanation.
    5. If NO part of the question can be searched on the web, return: NONE.

    Examples:

    Question: What is my GPA in the PDF, and is the university located in Lebanon, Debbieh?
    Search query: university located in Lebanon Debbieh

    Question: According to the PDF, where is Baalbek located?
    Search query: Baalbek location

    Question: What grade did I get and what is Tesla's stock price today?
    Search query: Tesla stock price today

    Question: What does the second paragraph of the uploaded file say?
    Search query: NONE

    Question: What is the GPA shown in the document and who is the president of Lebanon?
    Search query: president of Lebanon

    Now rewrite:

    Question: {question}
    Search query:
    """
    response = client.chat.completions.create(
        model="google/gemma-3-12b-it:free",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content.strip()

def get_openrouter_embeddings(texts: list[str]):
    """Uses the OpenAI client style to get embeddings from OpenRouter"""
    response = client.embeddings.create(
        model="sentence-transformers/all-minilm-l6-v2",
        input=texts,
        encoding_format="float"
    )
    # Extract the list of embedding vectors
    return [item.embedding for item in response.data]

def ask_gemma_with_context(context: str, user_query: str, web_answer: str = None):
    # Merge system instructions and user query into one 'user' message
    combined_prompt = (
        f"INSTRUCTIONS: You are a helpful assistant. Answer the question using ONLY the context below, and check the web search answer if provided. Filter/Combine both context and web search answer to answer the question.\n"
        f"If the answer isn't there, say you don't know.\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"WEB SEARCH ANSWER: {web_answer}\n\n"
        f"USER QUESTION: {user_query}"
    )

    stream = client.chat.completions.create(
        model="google/gemma-3-12b-it:free", # google/gemma-3-12b-it:free qwen/qwen3-coder:free z-ai/glm-4.5-air:free
        messages=[
            {"role": "user", "content": combined_prompt}
        ],
        stream=True
    )
    for chunk in stream:
        content = getattr(chunk.choices[0].delta, "content", None)
        if content:
            yield content



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
        user_question = question.question
        web_search = question.web_search
        web_answer = None
        if web_search:
            try:
                web_answer = await perform_web_search(user_question)
            except Exception as e:
                web_answer = None

        q_emb = get_openrouter_embeddings([user_question])[0]
        results = collection.query(query_embeddings=[q_emb], n_results=3)
        context = "\n\n".join(results["documents"][0])
        # answer = ask_gemma_with_context(context, user_question, web_answer)
        return StreamingResponse(ask_gemma_with_context(context, user_question, web_answer), media_type="text/plain")

    except Exception as e:
        print(f"Question processing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process question")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)