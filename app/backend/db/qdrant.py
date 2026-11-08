import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from qdrant_client.models import PayloadSchemaType

qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)


COLLECTION_NAME = "pdf_docs"

qdrant_client.create_payload_index(
    collection_name=COLLECTION_NAME,
    field_name="chat_id",
    field_schema=PayloadSchemaType.KEYWORD,
    wait=True
)

if not qdrant_client.collection_exists(COLLECTION_NAME):
    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=384,
            distance=Distance.COSINE
        )
    )