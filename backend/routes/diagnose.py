"""
Medical Image Diagnosis API Endpoint
Integrates EfficientNet image classification with RAG and treatment recommendations
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from typing import Optional
import logging

from config.database import get_database
from middleware.auth import get_current_user
from services.medical_image_pipeline import get_medical_image_pipeline
from models.disease_mappings import get_full_disease_context

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
medical_image_pipeline = get_medical_image_pipeline()


@router.post("/diagnose")
async def diagnose_medical_image(
    image: UploadFile = File(..., description="Medical image file (jpg, png, jpeg)"),
    modality: str = Form("skin", description="Image modality: skin, chest, eye, brain"),
    symptoms: Optional[str] = Form(None, description="Optional text description of symptoms"),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Diagnose disease from uploaded medical image using modality-specific EfficientNet models
    
    **Request:**
    - image: Image file (multipart/form-data)
    - symptoms: Optional text description of symptoms
    
    **Response:**
    ```json
    {
        "success": true,
        "data": {
            "disease": "Eczema",
            "confidence": 0.87,
            "all_predictions": [...],
            "doctor": {...},
            "treatment": {...},
            "explanation": "AI-generated explanation",
            "disclaimer": "..."
        }
    }
    ```
    """
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {image.content_type}. Please upload an image."
            )
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file"
            )
        
        logger.info(f"📸 Processing diagnosis request from user {current_user.get('email')}")
        logger.info(f"   Image: {image.filename} ({len(image_data)} bytes)")
        logger.info(f"   Modality: {modality}")
        if symptoms:
            logger.info(f"   Symptoms: {symptoms[:100]}...")

        try:
            result = await medical_image_pipeline.analyze(
                image_data=image_data,
                modality=modality,
                symptoms=symptoms,
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except RuntimeError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing image: {str(e)}"
            )

        prediction = result["prediction"]
        disease = result['disease']
        confidence = result['confidence']
        modality = result['modality']
        all_predictions = result['all_predictions'][:5]
        meets_threshold = result['meets_threshold']
        disease_context = get_full_disease_context(disease, confidence, modality=modality)
        
        # Build response
        response_data = {
            "modality": modality,
            "disease": disease,
            "confidence": round(confidence, 4),
            "meets_threshold": meets_threshold,
            "all_predictions": [
                {
                    "disease": p['disease'],
                    "confidence": round(p['confidence'], 4)
                }
                for p in all_predictions
            ],
            "doctor": disease_context['doctor'],
            "treatment": disease_context['treatment'],
            "tests": disease_context.get('tests', []),
            "disease_info": disease_context['disease_info'],
            "explanation": result['explanation'],
            "disclaimer": result['disclaimer']
        }
        
        # Log diagnosis to database (optional - for analytics)
        try:
            await _log_diagnosis(
                db=db,
                user_id=str(current_user['_id']),
                image_filename=image.filename,
                modality=modality,
                prediction=prediction,
                symptoms=symptoms
            )
        except Exception as e:
            logger.warning(f"Failed to log diagnosis: {e}")
        
        logger.info(f"✅ Diagnosis complete: {disease} ({confidence:.2%})")
        
        return {
            "success": True,
            "data": response_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Diagnosis endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


async def _generate_explanation(
    disease: str,
    confidence: float,
    modality: str,
    symptoms: Optional[str],
    disease_context: dict
) -> str:
    """
    Generate AI explanation using RAG service
    
    Args:
        disease: Predicted disease
        confidence: Prediction confidence
        symptoms: User-provided symptoms (optional)
        disease_context: Full disease context
        
    Returns:
        AI-generated explanation string
    """
    try:
        # Build context for LLM
        context_parts = [
            f"Based on {modality} image analysis, the predicted condition is {disease} with {confidence:.1%} confidence.",
            f"\nDisease Information:",
            f"- Medical Name: {disease_context['disease_info']['medical_name']}",
            f"- Description: {disease_context['disease_info']['description']}",
            f"- Typical Age: {disease_context['disease_info']['common_age']}",
        ]
        
        if symptoms:
            context_parts.append(f"\nPatient-reported symptoms: {symptoms}")
        
        context_parts.extend([
            f"\nRecommended Specialist: {disease_context['doctor']['specialty']}",
            f"Urgency Level: {disease_context['doctor']['urgency']}",
        ])
        
        context = "\n".join(context_parts)
        
        # Try to use RAG for additional medical context
        if ai_service.rag_enabled:
            try:
                # Query RAG with disease name
                rag_context = await ai_service.rag_service.retrieve_context(
                    query=f"{disease} {modality} condition treatment diagnosis",
                    k=3
                )
                if rag_context:
                    context += f"\n\nMedical Knowledge Base:\n{rag_context}"
            except Exception as e:
                logger.warning(f"RAG retrieval failed: {e}")
        
        # Generate explanation with LLM
        prompt = f"""{context}

Based on the above information, provide a clear, compassionate explanation for the patient covering:
1. What this condition is in simple terms
2. Why this diagnosis was suggested
3. What they should do next
4. Important considerations

Keep it concise (3-4 paragraphs), empathetic, and emphasize the importance of professional medical consultation."""
        
        explanation = await ai_service.get_simple_response(
            message=prompt,
            conversation_history=[]
        )
        
        return explanation
        
    except Exception as e:
        logger.error(f"Error generating explanation: {e}")
        # Fallback to template-based explanation
        return _get_fallback_explanation(disease, confidence, disease_context)


def _get_fallback_explanation(disease: str, confidence: float, disease_context: dict) -> str:
    """Generate template-based explanation if AI fails"""
    info = disease_context['disease_info']
    doctor = disease_context['doctor']
    
    if disease == "Normal":
        return (
            "Based on the image analysis, no significant skin condition was detected. "
            "This is a positive result, but remember that AI analysis has limitations. "
            "If you're experiencing any symptoms or concerns, please consult with a healthcare provider. "
            "Regular skin checks are recommended for everyone as part of routine healthcare."
        )
    
    explanation = (
        f"Based on the medical image analysis, the predicted condition is **{disease}** "
        f"({info['medical_name']}) with {confidence:.1%} confidence.\n\n"
        f"**About this condition:** {info['description']} "
        f"It commonly affects {info['common_age'].lower()} and has a prevalence of {info['prevalence']}.\n\n"
        f"**Next steps:** This diagnosis suggests consulting a {doctor['specialty']}. "
        f"The urgency level is {doctor['urgency']}, and {doctor['consultation_type']} consultation is recommended.\n\n"
        f"**Important:** This is an AI-assisted assessment and should not replace professional medical diagnosis. "
        f"Please consult a qualified healthcare provider for proper evaluation and treatment."
    )
    
    return explanation


def _get_disclaimer(meets_threshold: bool, confidence: float) -> str:
    """Generate appropriate disclaimer based on confidence"""
    base_disclaimer = (
        "⚠️ IMPORTANT MEDICAL DISCLAIMER: This is an AI-assisted preliminary assessment based on image analysis. "
        "It is NOT a medical diagnosis and should NOT be used as a substitute for professional medical advice, "
        "diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider "
        "with any questions you may have regarding a medical condition."
    )
    
    if not meets_threshold:
        base_disclaimer += (
            f"\n\n⚠️ LOW CONFIDENCE: The model confidence ({confidence:.1%}) is below the recommended threshold. "
            "Multiple conditions may be possible. Professional evaluation is especially important in this case."
        )
    
    if confidence > 0.9:
        base_disclaimer += (
            "\n\nWhile the model shows high confidence, professional verification is still essential for proper diagnosis."
        )
    
    return base_disclaimer


async def _log_diagnosis(
    db,
    user_id: str,
    image_filename: str,
    modality: str,
    prediction: dict,
    symptoms: Optional[str]
):
    """Log diagnosis to database for analytics and history"""
    from datetime import datetime
    
    log_entry = {
        "user_id": user_id,
        "timestamp": datetime.utcnow(),
        "image_filename": image_filename,
        "prediction": {
            "modality": modality,
            "disease": prediction['disease'],
            "confidence": prediction['confidence'],
            "meets_threshold": prediction['meets_threshold'],
            "top_predictions": prediction['all_predictions'][:5]
        },
        "symptoms": symptoms,
        "diagnosis_type": f"image_classification_{modality}",
        "model": f"efficientnet_b0_{modality}_disease"
    }
    
    await db.diagnosis_logs.insert_one(log_entry)
    logger.debug(f"Diagnosis logged to database")
