from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timedelta
from config.database import get_database
from middleware.auth import get_current_user, require_role
from models.prescription import Prescription
from bson import ObjectId
import json
import re

router = APIRouter()

@router.post("/prescriptions")
async def create_prescription(
    prescription: Prescription,
    current_user: dict = Depends(require_role(["doctor"])),
    db = Depends(get_database)
):
    """Create a new prescription (doctor only)"""
    try:
        prescription_dict = prescription.dict(by_alias=True, exclude={"id"})
        prescription_dict["doctor_id"] = str(current_user["_id"])
        prescription_dict["doctor_name"] = current_user["name"]
        
        result = await db.prescriptions.insert_one(prescription_dict)
        
        return {
            "success": True,
            "message": "Prescription created successfully",
            "prescription_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating prescription: {str(e)}"
        )

@router.get("/prescriptions")
async def get_prescriptions(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get prescriptions for current user"""
    try:
        # Patients see their own prescriptions
        if current_user["role"] == "patient":
            query = {"patient_id": str(current_user["_id"])}
        # Doctors see prescriptions they created
        elif current_user["role"] == "doctor":
            query = {"doctor_id": str(current_user["_id"])}
        # Admins see all
        else:
            query = {}
        
        cursor = db.prescriptions.find(query).sort("date", -1)
        prescriptions = await cursor.to_list(length=100)
        
        for prescription in prescriptions:
            prescription["_id"] = str(prescription["_id"])
        
        return {
            "success": True,
            "data": prescriptions
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching prescriptions: {str(e)}"
        )

@router.get("/prescriptions/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific prescription"""
    try:
        prescription = await db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
        
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        # Check authorization
        if current_user["role"] == "patient" and prescription["patient_id"] != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this prescription"
            )
        elif current_user["role"] == "doctor" and prescription["doctor_id"] != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this prescription"
            )
        
        prescription["_id"] = str(prescription["_id"])
        return {
            "success": True,
            "data": prescription
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching prescription: {str(e)}"
        )

@router.patch("/prescriptions/{prescription_id}/status")
async def update_prescription_status(
    prescription_id: str,
    status_update: dict,
    current_user: dict = Depends(require_role(["doctor", "admin"])),
    db = Depends(get_database)
):
    """Update prescription status (doctor/admin only)"""
    try:
        result = await db.prescriptions.update_one(
            {"_id": ObjectId(prescription_id)},
            {"$set": {"status": status_update["status"]}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        return {
            "success": True,
            "message": "Prescription status updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating prescription status: {str(e)}"
        )


@router.post("/prescriptions/upload")
async def upload_and_parse_prescription(
    file: Optional[UploadFile] = File(None),
    prescription_text: Optional[str] = Form(None),
    save_to_db: bool = Form(False),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upload a prescription image/PDF/text and parse it using AI"""
    from services.ai_service import AIService
    ai_service = AIService()

    # Get text to parse
    raw_text = ""
    if file and file.filename:
        content_bytes = await file.read()
        ctype = file.content_type or ""
        if "text" in ctype or file.filename.endswith(".txt"):
            raw_text = content_bytes.decode("utf-8", errors="ignore")
        elif "pdf" in ctype or file.filename.endswith(".pdf"):
            try:
                import io
                import importlib
                pdfplumber = importlib.import_module("pdfplumber")
                with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
                    raw_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
            except Exception:
                raw_text = f"[PDF file: {file.filename} - unable to extract text automatically]"
        else:
            # Image or unknown – pass filename as hint
            raw_text = f"[Uploaded file: {file.filename}]"

    if prescription_text:
        raw_text = (raw_text + "\n" + prescription_text).strip()

    if not raw_text:
        raise HTTPException(status_code=400, detail="No prescription content provided")

    extraction_prompt = f"""You are a medical prescription parser. Extract information from the following prescription and return ONLY valid JSON (no markdown, no explanation).

JSON structure:
{{
  "doctor_name": "string or empty",
  "patient_name": "string or empty",
  "diagnosis": "string - main condition/diagnosis",
  "date": "string - prescription date or today",
  "medicines": [
    {{
      "name": "medicine name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. twice daily",
      "duration": "e.g. 7 days",
      "times": ["08:00", "20:00"],
      "instructions": "e.g. take after food"
    }}
  ],
  "lab_tests": ["test name 1", "test name 2"],
  "dietary_advice": "any dietary restrictions or recommendations",
  "notes": "any other important notes"
}}

Prescription text:
{raw_text}

Return ONLY the JSON object, no other text."""

    try:
        ai_response = await ai_service.get_simple_response(extraction_prompt, [])
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
        else:
            parsed = json.loads(ai_response.strip())
    except Exception:
        # Fallback: best-effort extraction from text
        parsed = {
            "doctor_name": "",
            "patient_name": "",
            "diagnosis": "Extracted from uploaded prescription",
            "date": datetime.utcnow().isoformat(),
            "medicines": [],
            "lab_tests": [],
            "dietary_advice": "",
            "notes": raw_text[:500]
        }

    # Optionally save as a self-uploaded prescription
    prescription_id = None
    if save_to_db and parsed.get("medicines"):
        pres_doc = {
            "patient_id": str(current_user["_id"]),
            "doctor_id": str(current_user["_id"]),
            "patient_name": current_user.get("name", ""),
            "doctor_name": parsed.get("doctor_name") or "Self-upload",
            "diagnosis": parsed.get("diagnosis", ""),
            "medicines": parsed.get("medicines", []),
            "lab_tests": parsed.get("lab_tests", []),
            "dietary_advice": parsed.get("dietary_advice", ""),
            "notes": parsed.get("notes", ""),
            "date": datetime.utcnow(),
            "status": "active",
            "source": "uploaded"
        }
        result = await db.prescriptions.insert_one(pres_doc)
        prescription_id = str(result.inserted_id)

    return {
        "success": True,
        "parsed": parsed,
        "prescription_id": prescription_id,
        "raw_text": raw_text[:200] if raw_text else ""
    }


@router.post("/prescriptions/bulk-reminders")
async def create_bulk_reminders(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create medicine reminders in bulk from a parsed prescription"""
    from datetime import time as dt_time
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
            duration_str = med.get("duration", "7 days")
            raw_times = med.get("times", ["08:00"])

            # Determine frequency code
            freq_lower = frequency.lower()
            if "twice" in freq_lower or "2" in freq_lower:
                freq_code = "twice_daily"
            elif "thrice" in freq_lower or "3" in freq_lower or "three" in freq_lower:
                freq_code = "thrice_daily"
            else:
                freq_code = "daily"

            # Parse times
            time_objs = []
            for t in raw_times:
                try:
                    parts = t.split(":")
                    h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
                    time_objs.append(dt_time(h, m))
                except Exception:
                    time_objs.append(dt_time(8, 0))

            # Calculate end_date from duration string
            days = 7
            match = re.search(r'(\d+)\s*(day|week|month)', duration_str.lower())
            if match:
                num = int(match.group(1))
                unit = match.group(2)
                if unit == "week":
                    days = num * 7
                elif unit == "month":
                    days = num * 30
                else:
                    days = num

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
