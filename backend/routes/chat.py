from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
import os

from models.chat import ChatRequest, ChatResponse, ChatSession, Message
from middleware.auth import get_current_user
from config.database import get_database
from services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.post("/", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a message and get AI response"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Get or create session
    if chat_request.session_id:
        session = await db.chat_sessions.find_one({
            "_id": ObjectId(chat_request.session_id),
            "user_id": user_id
        })
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
    else:
        # Create new session
        session = {
            "user_id": user_id,
            "title": chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.chat_sessions.insert_one(session)
        session["_id"] = result.inserted_id
    
    # Add user message
    user_message = {
        "role": "user",
        "content": chat_request.message,
        "timestamp": datetime.utcnow()
    }
    
    # Get AI response with error handling
    try:
        if chat_request.use_rag:
            ai_response, sources = await ai_service.get_rag_response(
                chat_request.message,
                session.get("messages", [])
            )
        else:
            ai_response = await ai_service.get_simple_response(
                chat_request.message,
                session.get("messages", [])
            )
            sources = None
    except Exception as e:
        error_msg = str(e).lower()
        
        # Handle rate limit errors
        if "rate limit" in error_msg or "429" in error_msg or "quota" in error_msg:
            ai_response = """⚠️ **Rate Limit Exceeded**

The AI service is currently experiencing high demand. Here are your options:

• **Wait a Few Minutes** - Try again in 3-5 minutes when the rate limit resets
• **Basic Medical Info** - I can still provide general health information and suggestions
• **Contact Support** - If you need urgent assistance, please contact our support team

**What you asked:** """ + chat_request.message[:100]
        
        # Handle API key errors
        elif "api" in error_msg and "key" in error_msg:
            ai_response = """⚠️ **API Configuration Error**

The health assistant is temporarily unavailable due to a configuration issue. Our team has been notified and is working on a fix.

Please try again in a few moments."""
        
        # Handle connection errors
        elif "connection" in error_msg or "timeout" in error_msg:
            ai_response = """⚠️ **Connection Error**

Unable to connect to the health assistant service. This is usually temporary.

**Try:**
• Refresh the page and try again
• Wait a few seconds and submit your question again
• Contact support if the issue persists"""
        
        # Generic error
        else:
            ai_response = f"""⚠️ **Service Temporarily Unavailable**

We encountered an issue: {str(e)[:100]}

Please try again in a moment, or contact our support team for assistance."""
    
    # Add assistant message
    assistant_message = {
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.utcnow()
    }
    
    # Update session
    await db.chat_sessions.update_one(
        {"_id": session["_id"]},
        {
            "$push": {
                "messages": {
                    "$each": [user_message, assistant_message]
                }
            },
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return ChatResponse(
        message=ai_response,
        session_id=str(session["_id"]),
        sources=sources
    )

@router.get("/sessions", response_model=List[ChatSession])
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """Get all chat sessions for current user"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    sessions = await db.chat_sessions.find(
        {"user_id": user_id}
    ).sort("updated_at", -1).to_list(100)
    
    for session in sessions:
        session["_id"] = str(session["_id"])
    
    return sessions

@router.get("/sessions/{session_id}", response_model=ChatSession)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific chat session"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    session = await db.chat_sessions.find_one({
        "_id": ObjectId(session_id),
        "user_id": user_id
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    session["_id"] = str(session["_id"])
    return session

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a chat session"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    result = await db.chat_sessions.delete_one({
        "_id": ObjectId(session_id),
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    return {"message": "Session deleted successfully"}

@router.post("/upload", response_model=ChatResponse)
async def upload_file(
    file: UploadFile = File(...),
    message: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload a file and get AI response"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size (max 10MB)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 10MB limit"
        )
    
    # Get or create session
    if session_id:
        session = await db.chat_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": user_id
        })
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
    else:
        # Create new session
        session = {
            "user_id": user_id,
            "title": f"File: {file.filename}",
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.chat_sessions.insert_one(session)
        session["_id"] = result.inserted_id
    
    # Create user message with file info
    user_content = message or f"I've uploaded a file: {file.filename}"
    user_message = {
        "role": "user",
        "content": user_content,
        "file": {
            "name": file.filename,
            "type": file.content_type,
            "size": file_size
        },
        "timestamp": datetime.utcnow()
    }
    
    # Generate AI response about the file
    ai_response = f"I can see you've uploaded **{file.filename}** ({file_size / 1024:.1f} KB). " \
                  f"While I cannot directly analyze files yet, I can help answer questions or provide guidance based on what you tell me about it. " \
                  f"What would you like to know?"
    
    # Add assistant message
    assistant_message = {
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.utcnow()
    }
    
    # Update session
    await db.chat_sessions.update_one(
        {"_id": session["_id"]},
        {
            "$push": {
                "messages": {
                    "$each": [user_message, assistant_message]
                }
            },
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return ChatResponse(
        message=ai_response,
        session_id=str(session["_id"]),
        sources=None
    )
    
@router.post("/generate-recommendations")
async def generate_recommendations(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate structured health recommendations from user's message"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Get user's health profile for context
    user_profile = await db.users.find_one({"_id": current_user["_id"]})
    health_profile = user_profile.get("health_profile", {}) if user_profile else {}
    
    # Generate recommendations using AI
    recommendations = await ai_service.generate_health_recommendations(
        chat_request.message,
        health_profile
    )
    
    # Save recommendations to database
    recommendation_doc = {
        "user_id": user_id,
        "trigger_message": chat_request.message,
        "recommendations": recommendations,
        "created_at": datetime.utcnow(),
        "applied": False  # Track if user has applied these recommendations
    }
    
    result = await db.recommendations.insert_one(recommendation_doc)
    recommendation_doc["_id"] = str(result.inserted_id)
    
    return {
        "recommendation_id": str(result.inserted_id),
        "recommendations": recommendations,
        "message": "Recommendations generated successfully"
    }

@router.get("/recommendations/latest")
async def get_latest_recommendations(current_user: dict = Depends(get_current_user)):
    """Get user's latest recommendations"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    recommendation = await db.recommendations.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    if not recommendation:
        return {"recommendations": None, "message": "No recommendations found"}
    
    recommendation["_id"] = str(recommendation["_id"])
    return {"recommendations": recommendation}

@router.post("/recommendations/{recommendation_id}/apply")
async def apply_recommendations(
    recommendation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Apply recommendations to user's medicine reminders and meal plan"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Get the recommendation
    recommendation = await db.recommendations.find_one({
        "_id": ObjectId(recommendation_id),
        "user_id": user_id
    })
    
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found"
        )
    
    recommendations_data = recommendation["recommendations"]
    
    # Apply medications as reminders
    for med in recommendations_data.get("medications", []):
        reminder_dict = {
            "user_id": user_id,
            "medicine_name": med["name"],
            "dosage": med["dosage"],
            "frequency": med["frequency"],
            "times": ["08:00", "14:00", "20:00"],  # Default times
            "start_date": datetime.utcnow(),
            "end_date": None,
            "notes": med.get("notes", ""),
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "from_ai": True
        }
        await db.medicine_reminders.insert_one(reminder_dict)
    
    # Save meal plan
    meal_plan_dict = {
        "user_id": user_id,
        "date": datetime.utcnow().date().isoformat(),
        "meals": recommendations_data.get("meal_plan", {}),
        "created_at": datetime.utcnow(),
        "from_ai": True
    }
    await db.meal_plans.insert_one(meal_plan_dict)
    
    # Mark recommendation as applied
    await db.recommendations.update_one(
        {"_id": ObjectId(recommendation_id)},
        {"$set": {"applied": True, "applied_at": datetime.utcnow()}}
    )
    
    return {
        "message": "Recommendations applied successfully",
        "medications_added": len(recommendations_data.get("medications", [])),
        "meal_plan_saved": True
    }

