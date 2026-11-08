from core.ai_client import client
def get_openrouter_embeddings(texts: list[str]):
    """Uses the OpenAI client style to get embeddings from OpenRouter"""
    response = client.embeddings.create(
        model="sentence-transformers/all-minilm-l6-v2",
        input=texts,
        encoding_format="float"
    )
    # Extract the list of embedding vectors
    return [item.embedding for item in response.data]