from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    title: str = "New Conversation"
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    use_rag: bool = True

class ChatResponse(BaseModel):
    message: str
    session_id: str
    sources: Optional[List[dict]] = None
    success: bool = True
    extracted_preview: Optional[str] = None
