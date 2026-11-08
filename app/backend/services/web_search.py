from core.ai_client import client
from core.web_search_client import tavily_client
async def perform_web_search(user_question: str):
    rewritten_query = rewrite_question(user_question)
    response = await tavily_client.search(
        query=f"{rewritten_query}",
        include_answer="basic",
        search_depth="basic",
        max_results=1
    )
    return response['answer']

STREAM_MODEL = "openrouter/free" 


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
        model=STREAM_MODEL,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content.strip()