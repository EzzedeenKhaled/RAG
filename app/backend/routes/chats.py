from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.supabase import supabase
from qdrant_client.models import Filter, FieldCondition, MatchValue
from db.qdrant import qdrant_client, COLLECTION_NAME
import traceback

router = APIRouter()

class ChatCreate(BaseModel):
    title: str

@router.post("/chats")
async def create_chat(chat: ChatCreate):
    try:
        result = supabase.table("chats").insert({
            "title": chat.title
        }).execute()
        return result.data[0]
    except Exception as e:
        print(f"Error creating chat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chats")
async def list_chats():
    try:
        result = supabase.table("chats")\
            .select("*")\
            .order("created_at", desc=True)\
            .execute()
        return result.data
    except Exception as e:
        print(f"Error listing chats: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chats/{chat_id}/messages")
async def get_messages(chat_id: str):
    try:
        # First check if the chat exists
        chat_result = supabase.table("chats").select("id").eq("id", chat_id).execute()
        
        if not chat_result.data:
            raise HTTPException(status_code=404, detail=f"Chat {chat_id} not found")
        
        # Fix: Use desc=False for ascending order
        result = supabase.table('messages').select('*')\
            .eq('chat_id', chat_id)\
            .order('created_at', desc=False)\
            .execute()
        
        # Format messages for frontend
        messages = []
        for msg in result.data:
            messages.append({
                "id": msg["id"],
                "chat_id": msg["chat_id"],
                "role": msg["role"],
                "content": msg["content"],
                "created_at": msg["created_at"]
            })
        
        return messages
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting messages for chat {chat_id}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")
    
@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    try:
        existing = (
            supabase.table("chats")
            .select("id")
            .eq("id", chat_id)
            .execute()
        )

        if not existing.data:
            raise HTTPException(status_code=404, detail="Chat not found")

        qdrant_client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="chat_id",
                        match=MatchValue(value=chat_id)
                    )
                ]
            ),
            wait=True
        ) 

        supabase.table("chats").delete().eq("id", chat_id).execute()

        return {"message": "Chat deleted successfully"}

    except HTTPException:
        raise

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))