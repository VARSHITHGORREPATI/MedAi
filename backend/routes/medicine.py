from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from bson import ObjectId
from datetime import datetime, time as dt_time, timedelta
from typing import List
import re
import json
import base64

from models.medicine import MedicineReminder, MedicineReminderCreate, MedicineLog
from middleware.auth import get_current_user
from config.database import get_database

router = APIRouter()

@router.post("/reminders", response_model=MedicineReminder, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    reminder_data: MedicineReminderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new medicine reminder"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Convert time strings to time objects
    times = [dt_time.fromisoformat(t) for t in reminder_data.times]
    
    reminder_dict = {
        "user_id": user_id,
        "medicine_name": reminder_data.medicine_name,
        "dosage": reminder_data.dosage,
        "frequency": reminder_data.frequency,
        "times": times,
        "start_date": reminder_data.start_date,
        "end_date": reminder_data.end_date,
        "notes": reminder_data.notes,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.medicine_reminders.insert_one(reminder_dict)
    reminder_dict["_id"] = str(result.inserted_id)
    
    return MedicineReminder(**reminder_dict)

@router.get("/reminders", response_model=List[MedicineReminder])
async def get_reminders(
    active_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Get medicine reminders for current user"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    query = {"user_id": user_id}
    if active_only:
        query["is_active"] = True
    
    reminders = await db.medicine_reminders.find(query).sort("created_at", -1).to_list(100)
    
    for reminder in reminders:
        reminder["_id"] = str(reminder["_id"])
    
    return reminders

@router.get("/reminders/{reminder_id}", response_model=MedicineReminder)
async def get_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific medicine reminder"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    reminder = await db.medicine_reminders.find_one({
        "_id": ObjectId(reminder_id),
        "user_id": user_id
    })
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine reminder not found"
        )
    
    reminder["_id"] = str(reminder["_id"])
    return reminder

@router.put("/reminders/{reminder_id}", response_model=MedicineReminder)
async def update_reminder(
    reminder_id: str,
    reminder_data: MedicineReminderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a medicine reminder"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    times = [dt_time.fromisoformat(t) for t in reminder_data.times]
    
    update_dict = {
        "medicine_name": reminder_data.medicine_name,
        "dosage": reminder_data.dosage,
        "frequency": reminder_data.frequency,
        "times": times,
        "start_date": reminder_data.start_date,
        "end_date": reminder_data.end_date,
        "notes": reminder_data.notes,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.medicine_reminders.update_one(
        {"_id": ObjectId(reminder_id), "user_id": user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine reminder not found"
        )
    
    updated_reminder = await db.medicine_reminders.find_one({"_id": ObjectId(reminder_id)})
    updated_reminder["_id"] = str(updated_reminder["_id"])
    
    return updated_reminder

@router.delete("/reminders/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate a medicine reminder"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    result = await db.medicine_reminders.update_one(
        {"_id": ObjectId(reminder_id), "user_id": user_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine reminder not found"
        )
    
    return {"message": "Medicine reminder deactivated successfully"}

@router.post("/log", response_model=MedicineLog)
async def log_medicine_intake(
    medicine_log: MedicineLog,
    current_user: dict = Depends(get_current_user)
):
    """Log medicine intake"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    log_dict = {
        "reminder_id": medicine_log.reminder_id,
        "user_id": user_id,
        "taken_at": medicine_log.taken_at,
        "status": medicine_log.status,
        "notes": medicine_log.notes
    }
    
    await db.medicine_logs.insert_one(log_dict)
    
    return medicine_log


@router.post("/reminders/{reminder_id}/test-notification")
async def send_test_reminder_notification(
    reminder_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Send a test notification for a medicine reminder"""
    from services.notification_service import NotificationService
    from datetime import time as dt_time
    
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Get reminder
    reminder = await db.medicine_reminders.find_one({
        "_id": ObjectId(reminder_id),
        "user_id": user_id
    })
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine reminder not found"
        )
    
    notification_service = NotificationService()
    
    medicine_name = reminder["medicine_name"]
    dosage = reminder["dosage"]
    instructions = reminder.get("notes", "Take as prescribed")
    current_time = datetime.utcnow().time()
    
    results = {
        "email": None,
        "sms": None
    }
    
    # Send email
    if current_user.get("email"):
        email_html = f"""
<h2>🔔 Test Medicine Reminder</h2>
<p>Hi {current_user['name']},</p>
<p>This is a test reminder for your medicine:</p>
<ul>
    <li><strong>Medicine:</strong> {medicine_name}</li>
    <li><strong>Dosage:</strong> {dosage}</li>
    <li><strong>Instructions:</strong> {instructions}</li>
</ul>
<p>Stay healthy! 💊</p>
"""
        
        email_result = await notification_service.send_email(
            to_email=current_user["email"],
            subject=f"Test Medicine Reminder: {medicine_name}",
            html_content=email_html
        )
        results["email"] = email_result
    
    # Send SMS (if phone available)
    if current_user.get("phone"):
        sms_message = f"MedAI Test Reminder: {medicine_name} ({dosage}). {instructions}"
        sms_result = await notification_service.send_sms(
            to_phone=current_user["phone"],
            message=sms_message
        )
        results["sms"] = sms_result
    
    return {
        "message": "Test notification sent",
        "results": results
    }


@router.get("/reminders/{reminder_id}/notifications")
async def get_reminder_notification_history(
    reminder_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get notification history for a specific reminder"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    # Verify reminder belongs to user
    reminder = await db.medicine_reminders.find_one({
        "_id": ObjectId(reminder_id),
        "user_id": user_id
    })
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine reminder not found"
        )
    
    # Get notification history
    notifications = await db.reminder_notifications.find({
        "reminder_id": reminder_id
    }).sort("sent_at", -1).limit(limit).to_list(limit)
    
    for notification in notifications:
        notification["_id"] = str(notification["_id"])
    
    return {
        "reminder_id": reminder_id,
        "medicine_name": reminder["medicine_name"],
        "total_notifications": len(notifications),
        "notifications": notifications
    }


@router.get("/notifications/all")
async def get_all_notifications(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get all medicine reminder notifications for current user"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    notifications = await db.reminder_notifications.find({
        "user_id": user_id
    }).sort("sent_at", -1).limit(limit).to_list(limit)
    
    for notification in notifications:
        notification["_id"] = str(notification["_id"])
    
    return {
        "total": len(notifications),
        "notifications": notifications
    }


@router.post("/bulk-reminders")
async def create_bulk_reminders(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create medicine reminders in bulk from a prescription medicine list"""
    db = get_database()
    user_id = str(current_user["_id"])

    medicines = request.get("medicines", [])
    if not medicines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No medicines provided"
        )

    frequency_times = {
        "once daily": ["08:00:00"],
        "twice daily": ["08:00:00", "20:00:00"],
        "three times daily": ["08:00:00", "14:00:00", "20:00:00"],
        "four times daily": ["08:00:00", "12:00:00", "16:00:00", "20:00:00"],
        "at bedtime": ["21:00:00"],
        "morning": ["08:00:00"],
        "evening": ["18:00:00"],
        "bd": ["08:00:00", "20:00:00"],
        "tds": ["08:00:00", "14:00:00", "20:00:00"],
        "qid": ["08:00:00", "12:00:00", "16:00:00", "20:00:00"],
    }

    now = datetime.utcnow()
    created = 0

    for medicine in medicines:
        name = medicine.get("name") or medicine.get("medicine_name")
        if not name:
            continue

        dosage = medicine.get("dosage", "As prescribed")
        frequency_str = (medicine.get("frequency") or "once daily").lower().strip()
        duration_text = medicine.get("duration", "")

        times = frequency_times.get(frequency_str, ["08:00:00"])

        if "twice" in frequency_str or "bd" in frequency_str:
            frequency = "twice_daily"
        elif "three" in frequency_str or "tds" in frequency_str or "four" in frequency_str or "qid" in frequency_str:
            frequency = "custom"
        else:
            frequency = "daily"

        end_date = None
        if duration_text:
            days_match = re.search(r'(\d+)\s*day', duration_text, re.IGNORECASE)
            weeks_match = re.search(r'(\d+)\s*week', duration_text, re.IGNORECASE)
            months_match = re.search(r'(\d+)\s*month', duration_text, re.IGNORECASE)
            if days_match:
                end_date = now + timedelta(days=int(days_match.group(1)))
            elif weeks_match:
                end_date = now + timedelta(weeks=int(weeks_match.group(1)))
            elif months_match:
                end_date = now + timedelta(days=int(months_match.group(1)) * 30)

        reminder_dict = {
            "user_id": user_id,
            "medicine_name": name,
            "dosage": dosage,
            "frequency": frequency,
            "times": [dt_time.fromisoformat(t) for t in times],
            "start_date": now,
            "end_date": end_date,
            "notes": medicine.get("instructions") or medicine.get("notes") or "",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }

        await db.medicine_reminders.insert_one(reminder_dict)
        created += 1

    return {
        "success": True,
        "message": f"Created {created} medicine reminder(s)",
        "created_count": created
    }


@router.post("/scan")
async def scan_medicine(
    file: UploadFile = File(...),
    scan_type: str = Form("prescription"),
    current_user: dict = Depends(get_current_user)
):
    """Scan a medicine barcode or prescription image using AI"""
    from services.ai_service import AIService

    if not file.content_type or not (
        file.content_type.startswith("image/") or file.content_type == "application/pdf"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image or PDF files are accepted"
        )

    try:
        await file.read()

        ai_service = AIService()

        if scan_type == "barcode":
            prompt = (
                "A user has uploaded a medicine barcode or product label image. "
                "Since I cannot view the image directly, please provide guidance. "
                "Respond in JSON: "
                '{"medicine_name": null, "manufacturer": null, "dosage": null, '
                '"batch_number": null, "expiry_date": null, "found": false, '
                '"message": "Barcode scanning requires direct camera integration. '
                'Please search for your medicine by name in our pharmacy section."}'
            )
        else:
            prompt = (
                "A user has uploaded a prescription image for scanning. "
                "Since direct image reading isn't available in this mode, please provide guidance. "
                "Respond in JSON: "
                '{"medicines": [], "doctor_name": null, "patient_name": null, "date": null, "found": false, '
                '"message": "For prescription scanning, please use our AI chatbot: upload the image there or type the medicine names manually to add reminders."}'
            )

        response_text = await ai_service.get_simple_response(message=prompt, conversation_history=[])

        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group())
                return {"success": True, "scan_type": scan_type, "data": result}
            except json.JSONDecodeError:
                pass

        if scan_type == "barcode":
            return {"success": True, "scan_type": "barcode", "data": {
                "medicine_name": None, "found": False,
                "message": "Unable to read barcode. Please search for your medicine in the pharmacy."
            }}
        return {"success": True, "scan_type": "prescription", "data": {
            "medicines": [], "found": False,
            "message": "Unable to extract prescription details. Please add medicines manually or via the AI chatbot."
        }}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process scan: {str(e)}"
        )


@router.post("/bulk-reminders")
async def create_bulk_reminders_from_prescription(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create medicine reminders in bulk from a parsed prescription"""
    db = get_database()
    medicines = body.get("medicines", [])
    if not medicines:
        raise HTTPException(status_code=400, detail="No medicines provided")

    created = []
    errors = []
    user_id = str(current_user["_id"])

    for med in medicines:
        try:
            name = med.get("name", "Unknown Medicine")
            dosage = med.get("dosage", "as directed")
            frequency = med.get("frequency", "daily")
            duration_str = str(med.get("duration", "7 days"))
            raw_times = med.get("times", ["08:00"])

            # Map frequency to code
            freq_lower = frequency.lower()
            if "twice" in freq_lower or "2" in freq_lower or "bd" in freq_lower:
                freq_code = "twice_daily"
            elif "thrice" in freq_lower or "3" in freq_lower or "three" in freq_lower or "tds" in freq_lower:
                freq_code = "thrice_daily"
            else:
                freq_code = "daily"

            # Parse time strings
            time_objs = []
            for t in raw_times:
                try:
                    parts = str(t).split(":")
                    h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
                    time_objs.append(dt_time(h % 24, m % 60))
                except Exception:
                    time_objs.append(dt_time(8, 0))

            # Parse duration in days
            days = 7
            match = re.search(r'(\d+)\s*(day|week|month)', duration_str.lower())
            if match:
                num = int(match.group(1))
                unit = match.group(2)
                days = num * (7 if unit == "week" else 30 if unit == "month" else 1)

            start = datetime.utcnow()
            end = start + timedelta(days=days)

            reminder = {
                "user_id": user_id,
                "medicine_name": name,
                "dosage": dosage,
                "frequency": freq_code,
                "times": time_objs,
                "start_date": start,
                "end_date": end,
                "notes": med.get("instructions", ""),
                "is_active": True,
                "created_at": start,
                "updated_at": start
            }
            result = await db.medicine_reminders.insert_one(reminder)
            created.append({"name": name, "id": str(result.inserted_id)})
        except Exception as e:
            errors.append({"name": med.get("name", "?"), "error": str(e)})

    return {
        "success": True,
        "created": created,
        "errors": errors,
        "message": f"Created {len(created)} reminder(s)"
    }
