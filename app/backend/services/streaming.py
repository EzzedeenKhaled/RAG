from services.messages import save_message
async def stream_and_save(chat_id: str, stream_generator, background_tasks):
    yield f"CHAT_ID:{chat_id}\n"
    chunks = []

    async for chunk in stream_generator:
            chunks.append(chunk)
            yield chunk

    background_tasks.add_task(save_message, "assistant", "".join(chunks), chat_id)