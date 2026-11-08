from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.web_search import perform_web_search
from services.embeddings import get_openrouter_embeddings
from fastapi.responses import StreamingResponse
from services.llm import ask_gemma_with_context
from db.qdrant import qdrant_client, COLLECTION_NAME
from services.messages import save_message
from services.streaming import stream_and_save
from fastapi import BackgroundTasks
# import traceback

class Question(BaseModel):
    chat_id: str | None = None
    question: str
    web_search: bool = False 

router = APIRouter()

@router.post("/ask")
async def ask_question(question: Question, background_tasks: BackgroundTasks):
    try:
        user_question = question.question
        if question.chat_id:
            save_message("user", user_question, question.chat_id)
        else:
            question.chat_id = save_message("user", user_question)
        web_search = question.web_search
        web_answer = None
        if web_search:
            try:
                web_answer = await perform_web_search(user_question)
            except Exception as e:
                web_answer = None

        q_emb = get_openrouter_embeddings([user_question])[0]
        results = qdrant_client.query_points(
            collection_name=COLLECTION_NAME,
            query=q_emb,
            limit=3
        )
        context = "\n\n".join(
            point.payload["text"]
            for point in results.points
        )
        stream = ask_gemma_with_context(context, user_question, web_answer)
        generator = stream_and_save(question.chat_id, stream, background_tasks)
        return StreamingResponse(generator, media_type="text/plain", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    except Exception as e:
        # traceback.print_exc()
        print(f"Question processing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process question")