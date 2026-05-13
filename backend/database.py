import os
from motor.motor_asyncio import AsyncClient, AsyncDatabase
from contextlib import asynccontextmanager

# ─── MongoDB Connection ────────────────────────────────────────────

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "travel_agent"

client: AsyncClient = None
db: AsyncDatabase = None

async def connect_db():
    global client, db
    client = AsyncClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    print("Connected to MongoDB")

async def close_db():
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")

def get_db():
    if db is None:
        raise RuntimeError("Database not connected")
    return db
