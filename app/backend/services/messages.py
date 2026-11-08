from db.supabase import supabase

def save_message(role: str, content: str, chat_id: str = None, title: str = None):
    """
    If chat_id provided → append to existing chat.
    If no chat_id → create new chat (uses first user message as title), then save message.
    Returns: chat_id (so frontend can track it)
    """
    
    # 1. Create chat if new
    if not chat_id:
        chat_title = title or (content[:40] + "..." if len(content) > 40 else content)
        result = supabase.table("chats").insert({"title": chat_title}).execute()
        chat_id = result.data[0]["id"]
    else:
        # Update title if it's still a placeholder like "Chat 1", "Chat 2", etc.
        existing = supabase.table("chats").select("title").eq("id", chat_id).execute()
        existing_title = existing.data[0]["title"] if existing.data else ""
        
        import re
        if role == "user" and re.match(r"^Chat \d+$", existing_title):
            new_title = content[:40] + "..." if len(content) > 40 else content
            supabase.table("chats").update({"title": new_title}).eq("id", chat_id).execute()

    supabase.table("messages").insert({
        "chat_id": chat_id,
        "role": role,
        "content": content
    }).execute()

    return chat_id