from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from config.database import get_database
from middleware.auth import get_current_user
from services.diagnosis_orchestrator import get_diagnosis_orchestrator

router = APIRouter()
diagnosis_orchestrator = get_diagnosis_orchestrator()


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

        diagnosis_record = {
            "user_id": str(current_user["_id"]),
            "symptoms": symptoms,
            "modality": modality if image_data else "text",
            "has_image": bool(image_data),
            "prediction": result.get("prediction", {}),
            "doctor_mapping": result.get("doctor_mapping", {}),
            "module_routes": result.get("module_routes", {}),
            "rag_llm_output": result.get("rag_llm_output", ""),
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
