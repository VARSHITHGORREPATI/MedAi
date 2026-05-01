from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from config.database import get_database
from middleware.auth import get_current_user, require_role
from models.lab_test import LabTest, LabTestBooking
from bson import ObjectId

router = APIRouter()

# Lab Tests Management
@router.get("/tests")
async def get_lab_tests(
    category: str = None,
    search: str = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all available lab tests"""
    try:
        query = {}
        if category:
            query["category"] = category
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.lab_tests.find(query)
        tests = await cursor.to_list(length=100)
        
        for test in tests:
            test["_id"] = str(test["_id"])
        
        return {
            "success": True,
            "data": tests
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching lab tests: {str(e)}"
        )

@router.post("/tests")
async def create_lab_test(
    test: LabTest,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Create a new lab test (admin only)"""
    try:
        test_dict = test.dict(by_alias=True, exclude={"id"})
        result = await db.lab_tests.insert_one(test_dict)
        
        return {
            "success": True,
            "message": "Lab test created successfully",
            "test_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating lab test: {str(e)}"
        )

# Bookings
@router.post("/bookings")
async def create_booking(
    booking: LabTestBooking,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new lab test booking"""
    try:
        booking_dict = booking.dict(by_alias=True, exclude={"id"})
        booking_dict["user_id"] = str(current_user["_id"])
        
        result = await db.lab_test_bookings.insert_one(booking_dict)
        
        return {
            "success": True,
            "message": "Booking created successfully",
            "booking_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating booking: {str(e)}"
        )

@router.get("/bookings")
async def get_user_bookings(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all bookings for current user"""
    try:
        cursor = db.lab_test_bookings.find({"user_id": str(current_user["_id"])}).sort("booking_date", -1)
        bookings = await cursor.to_list(length=100)
        
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

@router.get("/bookings/{booking_id}")
async def get_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific booking"""
    try:
        booking = await db.lab_test_bookings.find_one({"_id": ObjectId(booking_id)})
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Only allow user to view their own booking or admin
        if booking["user_id"] != str(current_user["_id"]) and current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this booking"
            )
        
        booking["_id"] = str(booking["_id"])
        return {
            "success": True,
            "data": booking
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching booking: {str(e)}"
        )

@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_update: dict,
    current_user: dict = Depends(require_role(["admin", "doctor"])),
    db = Depends(get_database)
):
    """Update booking status (admin/doctor only)"""
    try:
        result = await db.lab_test_bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"status": status_update["status"]}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        return {
            "success": True,
            "message": "Booking status updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating booking status: {str(e)}"
        )

@router.post("/upload-prescription")
async def upload_prescription(
    booking_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upload prescription for a booking"""
    try:
        user_id = str(current_user["_id"])
        
        # Verify booking belongs to user
        booking = await db.lab_test_bookings.find_one({
            "_id": ObjectId(booking_id),
            "user_id": user_id
        })
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size (max 5MB)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 5MB limit"
            )
        
        # Store file info
        prescription_info = {
            "filename": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "uploaded_at": datetime.utcnow()
        }
        
        # Update booking with prescription info
        await db.lab_test_bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {
                "$set": {
                    "prescription_url": f"prescriptions/{booking_id}/{file.filename}",
                    "prescription_info": prescription_info
                }
            }
        )
        
        return {
            "success": True,
            "message": "Prescription uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading prescription: {str(e)}"
        )

@router.post("/upload-report")
async def upload_report(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upload lab report"""
    try:
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
        
        # Store report info in database
        report_data = {
            "user_id": user_id,
            "title": title or file.filename,
            "filename": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "file_url": f"reports/{user_id}/{file.filename}",
            "uploaded_at": datetime.utcnow()
        }
        
        result = await db.lab_reports.insert_one(report_data)
        
        return {
            "success": True,
            "message": "Lab report uploaded successfully",
            "report_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading report: {str(e)}"
        )

@router.get("/reports")
async def get_user_reports(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all lab reports for current user"""
    try:
        user_id = str(current_user["_id"])
        
        cursor = db.lab_reports.find({"user_id": user_id}).sort("uploaded_at", -1)
        reports = await cursor.to_list(length=100)
        
        for report in reports:
            report["_id"] = str(report["_id"])
        
        return {
            "success": True,
            "data": reports
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reports: {str(e)}"
        )
