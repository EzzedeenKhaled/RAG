import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.embeddings import get_openrouter_embeddings
from db.qdrant import qdrant_client, COLLECTION_NAME
from qdrant_client.models import PointStruct
from db.supabase import supabase
import uuid

router = APIRouter()



@router.post("/upload")
async def upload_file(file: UploadFile = File(...), chat_id: str | None = Form(None)):
    try:
        document_id = str(uuid.uuid4())

         # 1. Create chat if chat_id doesn't exist
        if not chat_id:
            result = supabase.table("chats").insert({
                "title": file.filename
            }).execute()

            chat_id = result.data[0]["id"]

        # 2. Parse PDF
        pdf_bytes = await file.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = "".join([page.extract_text() or "" for page in reader.pages])

        # 3. Chunk Text
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        chunks = splitter.split_text(text)

        # 4. Get Embeddings via OpenRouter
        embeddings = get_openrouter_embeddings(chunks)

        # 5. Add to ChromaDB
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                PointStruct(
                    id=str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{document_id}_{i}")),
                    vector=embedding,
                    payload={
                        "chat_id": chat_id,
                        "document_id": document_id,
                        "filename": file.filename,
                        "text": chunk
                        }
                    )
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
            ]
        )
        return {"status": "success", "chunks_processed": len(chunks), "chat_id": chat_id}
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))