from core.ai_client import async_client

STREAM_MODEL = "openrouter/free" 

async def ask_gemma_with_context(context: str, user_query: str, web_answer: str = None):
    # Merge system instructions and user query into one 'user' message
    combined_prompt = (
        f"INSTRUCTIONS: You are a helpful assistant. Answer the question using ONLY the context below, and check the web search answer if provided. Filter/Combine both context and web search answer to answer the question.\n"
        f"If the answer isn't there, say you don't know.\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"WEB SEARCH ANSWER: {web_answer}\n\n"
        f"USER QUESTION: {user_query}"
    )

    stream = await async_client.chat.completions.create(
        model=STREAM_MODEL,
        messages=[{"role": "user", "content": combined_prompt}],
        stream=True,
        extra_body={
            "provider": {
                "require_parameters": True
            }
        }
    )
    async for chunk in stream:
        if not chunk.choices:
            continue
        content = chunk.choices[0].delta.content
        if content:
            yield content
    