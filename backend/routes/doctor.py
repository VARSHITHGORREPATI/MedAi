from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta
from config.database import get_database
from middleware.auth import get_current_user, require_role
from bson import ObjectId
import math

router = APIRouter()

@router.get("/dashboard")
async def get_doctor_dashboard(
    current_user: dict = Depends(require_role(["doctor"])),
    db = Depends(get_database)
):
    """Get doctor dashboard statistics"""
    try:
        doctor_id = str(current_user["_id"])
        
        # Get counts
        total_patients = await db.prescriptions.distinct("patient_id", {"doctor_id": doctor_id})
        total_prescriptions = await db.prescriptions.count_documents({"doctor_id": doctor_id})
        
        # Get recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        prescriptions_this_week = await db.prescriptions.count_documents({
            "doctor_id": doctor_id,
            "date": {"$gte": week_ago}
        })
        
        return {
            "success": True,
            "data": {
                "total_patients": len(total_patients),
                "total_prescriptions": total_prescriptions,
                "prescriptions_this_week": prescriptions_this_week
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard: {str(e)}"
        )

@router.get("/patients")
async def get_doctor_patients(
    current_user: dict = Depends(require_role(["doctor"])),
    db = Depends(get_database)
):
    """Get all patients for a doctor"""
    try:
        doctor_id = str(current_user["_id"])
        
        # Get unique patient IDs from prescriptions
        patient_ids = await db.prescriptions.distinct("patient_id", {"doctor_id": doctor_id})
        
        # Get patient details
        patients = []
        for patient_id in patient_ids:
            patient = await db.users.find_one({"_id": ObjectId(patient_id)}, {"password": 0})
            if patient:
                patient["_id"] = str(patient["_id"])
                
                # Get prescription count for this patient
                prescription_count = await db.prescriptions.count_documents({
                    "doctor_id": doctor_id,
                    "patient_id": patient_id
                })
                patient["prescription_count"] = prescription_count
                
                # Get last prescription date
                last_prescription = await db.prescriptions.find_one(
                    {"doctor_id": doctor_id, "patient_id": patient_id},
                    sort=[("date", -1)]
                )
                patient["last_visit"] = last_prescription["date"] if last_prescription else None
                
                patients.append(patient)
        
        return {
            "success": True,
            "data": patients
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching patients: {str(e)}"
        )

@router.get("/patients/{patient_id}")
async def get_patient_details(
    patient_id: str,
    current_user: dict = Depends(require_role(["doctor"])),
    db = Depends(get_database)
):
    """Get detailed information about a specific patient"""
    try:
        # Get patient info
        patient = await db.users.find_one({"_id": ObjectId(patient_id)}, {"password": 0})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        patient["_id"] = str(patient["_id"])
        
        # Get prescriptions
        cursor = db.prescriptions.find({
            "patient_id": patient_id,
            "doctor_id": str(current_user["_id"])
        }).sort("date", -1)
        prescriptions = await cursor.to_list(length=50)
        
        for prescription in prescriptions:
            prescription["_id"] = str(prescription["_id"])
        
        # Get health logs
        cursor = db.health_logs.find({"user_id": patient_id}).sort("date", -1).limit(10)
        health_logs = await cursor.to_list(length=10)
        
        for log in health_logs:
            log["_id"] = str(log["_id"])
        
        return {
            "success": True,
            "data": {
                "patient": patient,
                "prescriptions": prescriptions,
                "health_logs": health_logs
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching patient details: {str(e)}"
        )

@router.get("/search")
async def search_doctors(
    specialty: str = None,
    search: str = None,
    city: str = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Search for doctors by specialty, name, and/or city"""
    try:
        query = {"role": "doctor"}

        if specialty:
            query["specialty"] = {"$regex": specialty, "$options": "i"}

        if city:
            query["location"] = {"$regex": city, "$options": "i"}

        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"specialty": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}},
            ]

        cursor = db.users.find(query, {"password": 0}).limit(50)
        doctors = await cursor.to_list(length=50)

        for doctor in doctors:
            doctor["_id"] = str(doctor["_id"])

        return {
            "success": True,
            "data": doctors
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching doctors: {str(e)}"
        )

@router.put("/profile")
async def update_doctor_profile(
    profile_data: dict,
    current_user: dict = Depends(require_role(["doctor"])),
    db = Depends(get_database)
):
    """Update doctor's own profile (specialty, location, availability, etc.)"""
    try:
        allowed_fields = ["specialty", "location", "bio", "experience_years",
                          "consultation_fee", "available_for_message",
                          "available_for_voice", "available_for_video",
                          "available_for_appointment", "languages", "qualification"]
        update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
        update_data["updated_at"] = datetime.utcnow()

        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
        return {"success": True, "message": "Profile updated"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )
