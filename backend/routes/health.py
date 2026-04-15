from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, date, timedelta
from typing import List

from models.health import HealthLog, HealthLogCreate, HealthAnalysis
from middleware.auth import get_current_user
from config.database import get_database
from services.health_analytics import HealthAnalyticsService

router = APIRouter()
health_analytics = HealthAnalyticsService()

@router.post("/logs", response_model=HealthLog, status_code=status.HTTP_201_CREATED)
async def create_health_log(
    log_data: HealthLogCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new health log entry"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    log_dict = {
        "user_id": user_id,
        "date": log_data.date or date.today(),
        "vital_signs": log_data.vital_signs.dict() if log_data.vital_signs else None,
        "symptoms": log_data.symptoms,
        "notes": log_data.notes,
        "mood": log_data.mood,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.health_logs.insert_one(log_dict)
    log_dict["_id"] = str(result.inserted_id)
    
    return HealthLog(**log_dict)

@router.get("/logs", response_model=List[HealthLog])
async def get_health_logs(
    start_date: str = None,
    end_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get health logs for current user"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    query = {"user_id": user_id}
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            date_query["$lte"] = datetime.fromisoformat(end_date)
        query["date"] = date_query
    
    logs = await db.health_logs.find(query).sort("date", -1).to_list(100)
    
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return logs

@router.get("/logs/{log_id}", response_model=HealthLog)
async def get_health_log(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific health log"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    log = await db.health_logs.find_one({
        "_id": ObjectId(log_id),
        "user_id": user_id
    })
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    log["_id"] = str(log["_id"])
    return log

@router.put("/logs/{log_id}", response_model=HealthLog)
async def update_health_log(
    log_id: str,
    log_data: HealthLogCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a health log"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    update_dict = {
        "vital_signs": log_data.vital_signs.dict() if log_data.vital_signs else None,
        "symptoms": log_data.symptoms,
        "notes": log_data.notes,
        "mood": log_data.mood,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.health_logs.update_one(
        {"_id": ObjectId(log_id), "user_id": user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    updated_log = await db.health_logs.find_one({"_id": ObjectId(log_id)})
    updated_log["_id"] = str(updated_log["_id"])
    
    return updated_log

@router.delete("/logs/{log_id}")
async def delete_health_log(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a health log"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    result = await db.health_logs.delete_one({
        "_id": ObjectId(log_id),
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    return {"message": "Health log deleted successfully"}

@router.get("/analysis", response_model=HealthAnalysis)
async def get_health_analysis(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get health analytics and trends"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Get logs from the last N days
    start_date = datetime.utcnow() - timedelta(days=days)
    logs = await db.health_logs.find({
        "user_id": user_id,
        "date": {"$gte": start_date}
    }).sort("date", 1).to_list(1000)
    
    # Analyze health data
    analysis = await health_analytics.analyze_health_data(logs)
    
    return analysis
