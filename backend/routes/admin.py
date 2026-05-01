from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta
from config.database import get_database
from middleware.auth import get_current_user, require_role
from bson import ObjectId
import bcrypt
from pydantic import BaseModel, EmailStr

router = APIRouter()

# Pydantic model for creating doctor
class CreateDoctorRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str = None

@router.get("/stats")
async def get_admin_stats(
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Get admin dashboard statistics"""
    try:
        # Get counts
        total_users = await db.users.count_documents({})
        total_patients = await db.users.count_documents({"role": "patient"})
        total_doctors = await db.users.count_documents({"role": "doctor"})
        total_products = await db.products.count_documents({})
        total_bookings = await db.lab_test_bookings.count_documents({})
        total_prescriptions = await db.prescriptions.count_documents({})
        
        # Get recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users_week = await db.users.count_documents({"created_at": {"$gte": week_ago}})
        new_bookings_week = await db.lab_test_bookings.count_documents({"booking_date": {"$gte": week_ago}})
        
        return {
            "success": True,
            "data": {
                "total_users": total_users,
                "total_patients": total_patients,
                "total_doctors": total_doctors,
                "total_products": total_products,
                "total_bookings": total_bookings,
                "total_prescriptions": total_prescriptions,
                "new_users_this_week": new_users_week,
                "new_bookings_this_week": new_bookings_week
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}"
        )

@router.get("/users")
async def get_all_users(
    role: str = None,
    search: str = None,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Get all users with optional filtering"""
    try:
        query = {}
        if role:
            query["role"] = role
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.users.find(query, {"password": 0}).sort("created_at", -1)
        users = await cursor.to_list(length=200)
        
        for user in users:
            user["_id"] = str(user["_id"])
        
        return {
            "success": True,
            "data": users
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_update: dict,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Update user role (admin only)"""
    try:
        valid_roles = ["patient", "doctor", "admin"]
        new_role = role_update.get("role")
        
        if new_role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {valid_roles}"
            )
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "message": "User role updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user role: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Delete a user (admin only)"""
    try:
        # Prevent admin from deleting themselves
        if user_id == str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )

@router.post("/create-doctor")
async def create_doctor_account(
    doctor_data: CreateDoctorRequest,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Create a new doctor account (admin only)"""
    try:
        # Check if email already exists
        existing_user = await db.users.find_one({"email": doctor_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = bcrypt.hashpw(doctor_data.password.encode('utf-8'), bcrypt.gensalt())
        
        # Create doctor user
        doctor_user = {
            "name": doctor_data.name,
            "email": doctor_data.email,
            "password": hashed_password.decode('utf-8'),
            "role": "doctor",
            "phone": doctor_data.phone,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.users.insert_one(doctor_user)
        
        return {
            "success": True,
            "message": "Doctor account created successfully",
            "data": {
                "id": str(result.inserted_id),
                "name": doctor_data.name,
                "email": doctor_data.email,
                "role": "doctor"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating doctor account: {str(e)}"
        )

@router.get("/bookings")
async def get_all_bookings(
    status_filter: str = None,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Get all lab test bookings (admin only)"""
    try:
        query = {}
        if status_filter:
            query["status"] = status_filter
        
        cursor = db.lab_test_bookings.find(query).sort("booking_date", -1)
        bookings = await cursor.to_list(length=200)
        
        for booking in bookings:
            booking["_id"] = str(booking["_id"])
        
        return {
            "success": True,
            "data": bookings
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bookings: {str(e)}"
        )
