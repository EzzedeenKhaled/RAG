from tavily import AsyncTavilyClient
import os
from dotenv import load_dotenv

load_dotenv()

tavily_client = AsyncTavilyClient(
    api_key=os.getenv("TAVILY_API_KEY")
)