import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.ask import router as ask_router
from routes.upload import router as upload_router
from routes.chats import router as chats_router

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        FRONTEND_URL
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask_router)
app.include_router(upload_router)
app.include_router(chats_router)