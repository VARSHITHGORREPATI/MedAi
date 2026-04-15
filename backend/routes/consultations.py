from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import Optional

from middleware.auth import get_current_user
from config.database import get_database

router = APIRouter()


@router.get("")
async def get_consultations(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get all consultations for the current user"""
    try:
        user_id = str(current_user["_id"])
        query = {"user_id": user_id}
        if status_filter:
            query["status"] = status_filter

        consultations = await db.consultations.find(query).sort("created_at", -1).to_list(100)
        for c in consultations:
            c["_id"] = str(c["_id"])

        return {"success": True, "consultations": consultations, "total": len(consultations)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching consultations: {str(e)}"
        )


@router.post("")
async def create_consultation(
    consultation_data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new consultation record"""
    try:
        user_id = str(current_user["_id"])
        now = datetime.utcnow()

        allowed_fields = [
            "doctor_name", "doctor_id", "specialization", "consultation_type",
            "status", "date", "time", "duration", "chief_complaint",
            "notes", "fee", "meeting_link", "prescription_given"
        ]
        doc = {k: consultation_data[k] for k in allowed_fields if k in consultation_data}
        doc["user_id"] = user_id
        doc.setdefault("status", "scheduled")
        doc["created_at"] = now
        doc["updated_at"] = now

        result = await db.consultations.insert_one(doc)
        doc["_id"] = str(result.inserted_id)

        return {"success": True, "consultation": doc}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating consultation: {str(e)}"
        )


@router.get("/{consultation_id}")
async def get_consultation(
    consultation_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get a specific consultation"""
    try:
        user_id = str(current_user["_id"])
        consultation = await db.consultations.find_one({
            "_id": ObjectId(consultation_id),
            "user_id": user_id
        })

        if not consultation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")

        consultation["_id"] = str(consultation["_id"])
        return {"success": True, "consultation": consultation}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching consultation: {str(e)}"
        )


@router.put("/{consultation_id}")
async def update_consultation(
    consultation_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a consultation"""
    try:
        user_id = str(current_user["_id"])

        allowed_fields = ["status", "notes", "duration", "prescription_given", "meeting_link"]
        update = {k: update_data[k] for k in allowed_fields if k in update_data}
        update["updated_at"] = datetime.utcnow()

        result = await db.consultations.update_one(
            {"_id": ObjectId(consultation_id), "user_id": user_id},
            {"$set": update}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")

        return {"success": True, "message": "Consultation updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating consultation: {str(e)}"
        )
