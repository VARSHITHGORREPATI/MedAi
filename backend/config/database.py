from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os

# MongoDB client instance
mongodb_client: Optional[Any] = None
database: Optional[Any] = None

async def connect_db():
    """Connect to MongoDB Atlas"""
    global mongodb_client, database
    
    try:
        mongodb_uri = os.getenv("MONGODB_URI")
        mongodb_client = AsyncIOMotorClient(
            mongodb_uri,
            server_api=ServerApi('1')
        )
        
        # Ping to verify connection
        await mongodb_client.admin.command('ping')
        
        database = mongodb_client[os.getenv("DB_NAME", "medai")]
        print(f"[OK] MongoDB Connected: {database.name}")
        
    except Exception as e:
        print(f"[ERROR] MongoDB Connection Error: {str(e)}")
        raise e

async def close_db():
    """Close MongoDB connection"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("[OK] MongoDB connection closed")

def get_database() -> Any:
    """Get database instance"""
    if database is None:
        raise RuntimeError("Database is not connected. Call connect_db() before get_database().")
    return database
