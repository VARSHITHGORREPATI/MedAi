from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from config.database import get_database
from middleware.auth import get_current_user
from services.diagnosis_orchestrator import get_diagnosis_orchestrator
from services.multimodal_diagnosis_service import MultimodalDiagnosisService

router = APIRouter()
diagnosis_orchestrator = get_diagnosis_orchestrator()
multimodal_service = MultimodalDiagnosisService()


MEDAI_DOCTOR_ROLES = [
    {
        "name": "Dr. Aisha Patel",
        "specialty": "General Physician",
        "role": "Primary triage and first consultation",
        "experience_years": 8,
        "location": "Online",
    },
    {
        "name": "Dr. Michael Chen",
        "specialty": "Dermatologist",
        "role": "Skin rashes, lesions, and inflammation",
        "experience_years": 11,
        "location": "City Center Clinic",
    },
    {
        "name": "Dr. Sofia Martinez",
        "specialty": "Pulmonologist",
        "role": "Chest findings and respiratory conditions",
        "experience_years": 10,
        "location": "Respiratory Institute",
    },
    {
        "name": "Dr. Rahul Iyer",
        "specialty": "Ophthalmologist",
        "role": "Retina, vision, and OCT-based review",
        "experience_years": 9,
        "location": "Vision Care Hospital",
    },
    {
        "name": "Dr. Elena Novak",
        "specialty": "Neurologist",
        "role": "Brain and nervous system evaluation",
        "experience_years": 13,
        "location": "Neuro Specialty Center",
    },
]


async def _get_doctor_suggestions(db, specialty_text: str) -> list[dict]:
    specialty_hint = (specialty_text or "").split("(")[0].strip()
    query = {"role": "doctor"}
    if specialty_hint:
        query["specialty"] = {"$regex": specialty_hint, "$options": "i"}

    doctors = await db.users.find(
        query,
        {
            "password": 0,
            "password_hash": 0,
        },
    ).limit(6).to_list(6)

    suggestions = []
    for doctor in doctors:
        suggestions.append(
            {
                "id": str(doctor["_id"]),
                "name": doctor.get("name", "Doctor"),
                "specialty": doctor.get("specialty") or specialty_hint or "General Physician",
                "role": doctor.get("bio") or "Clinical consultation",
                "location": doctor.get("location") or "Not specified",
                "experience_years": doctor.get("experience_years"),
                "consultation_fee": doctor.get("consultation_fee"),
            }
        )

    if suggestions:
        return suggestions
    return MEDAI_DOCTOR_ROLES


@router.post("/multimodal")
async def multimodal_diagnosis(
    symptoms: Optional[str] = Form(None),
    modality: str = Form("skin"),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Multimodal diagnosis endpoint combining image and symptom analysis
    
    Features:
    - Image pathway: EfficientNet model
    - Text pathway: Symptom classifier
    - Fusion: Weighted average of predictions
    - Confidence-based decision system
    - Structured medical recommendations
    
    Args:
        symptoms: Comma-separated symptom text (optional)
        modality: Image modality (skin, chest, eye, brain)
        patient_age: Patient age for context (optional)
        patient_gender: Patient gender for context (optional)
        image: Medical image file (optional)
        
    Returns:
        Comprehensive diagnosis result with recommendations
    """
    try:
        # Validate input
        if not symptoms and not image:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide either symptoms, medical image, or both for multimodal diagnosis"
            )
        
        # Process image if provided
        image_bytes = None
        if image:
            if not image.content_type or not image.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only image files are supported"
                )
            image_bytes = await image.read()
            if not image_bytes:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded image is empty"
                )
        
        # Run multimodal diagnosis
        result = multimodal_service.diagnose_multimodal(
            image_bytes=image_bytes,
            symptoms=symptoms,
            modality=modality,
            patient_age=patient_age,
            patient_gender=patient_gender
        )
        
        # Check for errors
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Diagnosis failed")
            )
        
        # Get doctor suggestions based on specialty
        doctor_specialty = result.get("doctor_specialty", "General Physician")
        doctor_suggestions = await _get_doctor_suggestions(db, doctor_specialty)
        result["doctor_suggestions"] = doctor_suggestions
        
        # Save to database
        diagnosis_record = {
            "user_id": str(current_user["_id"]),
            "symptoms": symptoms,
            "modality": modality,
            "has_image": bool(image_bytes),
            "patient_age": patient_age,
            "patient_gender": patient_gender,
            "diagnosis_mode": result.get("mode"),
            "predicted_disease": result.get("predicted_disease"),
            "confidence": result.get("confidence"),
            "confidence_level": result.get("confidence_level"),
            "agreement": result.get("agreement"),
            "requires_doctor": result.get("requires_doctor"),
            "urgency": result.get("urgency"),
            "doctor_specialty": doctor_specialty,
            "recommendations": result.get("recommendations", []),
            "fusion_method": result.get("fusion_method"),
            "created_at": datetime.utcnow(),
            "source": "multimodal-diagnosis-api"
        }
        await db.multimodal_diagnosis_history.insert_one(diagnosis_record)
        
        # Also log to health tracking
        if symptoms:
            health_log = {
                "user_id": str(current_user["_id"]),
                "date": datetime.utcnow(),
                "symptoms": [s.strip() for s in symptoms.split(",") if s.strip()],
                "notes": (
                    f"Multimodal AI diagnosis: {result.get('predicted_disease')} "
                    f"(confidence: {result.get('confidence_level')}, "
                    f"mode: {result.get('mode')})"
                ),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "from_multimodal_ai": True
            }
            await db.health_logs.insert_one(health_log)
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal diagnosis failed: {str(exc)}"
        )


@router.post("/complete")
async def complete_diagnosis(
    symptoms: Optional[str] = Form(None),
    modality: str = Form("basic"),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Unified diagnosis pipeline endpoint:
    - Decision layer: image -> EfficientNet, text -> Symptom model
    - RAG retrieval + LLM explanation
    - Specialist mapping + downstream module routing
    """
    try:
        image_data = None
        if image:
            if not image.content_type or not image.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only image files are supported for image diagnosis.",
                )
            image_data = await image.read()
            if not image_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded image is empty.",
                )

        result = await diagnosis_orchestrator.run(
            symptoms=symptoms,
            image_data=image_data,
            modality=modality,
        )

        doctor_mapping = result.get("doctor_mapping", {})
        treatment = result.get("treatment", {})
        tests = result.get("tests", [])
        doctor_suggestions = await _get_doctor_suggestions(
            db,
            doctor_mapping.get("specialty", ""),
        )

        reminder_suggestions = []
        for med in (treatment.get("medications") or [])[:4]:
            reminder_suggestions.append(
                {
                    "medicine_name": med,
                    "frequency": "twice_daily",
                    "times": ["08:00", "20:00"],
                }
            )

        care_plan = {
            "doctor_suggestions": doctor_suggestions,
            "appointment": {
                "recommended_within": "24 hours"
                if doctor_mapping.get("urgency") in ("urgent", "soon")
                else "3-7 days",
                "consultation_type": doctor_mapping.get("consultation_type", "telemedicine or in-person"),
                "specialty": doctor_mapping.get("specialty", "General Physician"),
            },
            "lab_tests": tests[:5],
            "pharmacy_medicines": (treatment.get("medications") or [])[:6],
            "medicine_reminders": reminder_suggestions,
            "health_tracking": {
                "status": "logged",
                "module": "/health-tracking",
                "note": "This assessment is added to your health tracking history.",
            },
        }
        result["chatbot_care_plan"] = care_plan

        health_log = {
            "user_id": str(current_user["_id"]),
            "date": datetime.utcnow(),
            "symptoms": [symptoms] if symptoms else [],
            "notes": (
                f"AI triage result: {result.get('prediction', {}).get('disease', 'Unknown')} "
                f"({round(float(result.get('prediction', {}).get('confidence', 0.0)) * 100)}%)."
            ),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "from_ai_chatbot": True,
        }
        await db.health_logs.insert_one(health_log)

        diagnosis_record = {
            "user_id": str(current_user["_id"]),
            "symptoms": symptoms,
            "modality": modality if image_data else "text",
            "has_image": bool(image_data),
            "prediction": result.get("prediction", {}),
            "doctor_mapping": result.get("doctor_mapping", {}),
            "module_routes": result.get("module_routes", {}),
            "rag_llm_output": result.get("rag_llm_output", ""),
            "chatbot_care_plan": result.get("chatbot_care_plan", {}),
            "created_at": datetime.utcnow(),
            "source": "chatbot-ui-unified-diagnosis",
        }
        await db.ai_diagnosis_history.insert_one(diagnosis_record)

        return {"success": True, "data": result}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run diagnosis pipeline: {str(exc)}",
        )
