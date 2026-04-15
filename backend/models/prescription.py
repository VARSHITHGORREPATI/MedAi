from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId

class PrescriptionMedicine(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

class Prescription(BaseModel):
    id: Optional[str] = Field(default=None, alias='_id')
    patient_id: str
    doctor_id: str
    patient_name: str
    doctor_name: str
    diagnosis: str
    medicines: List[PrescriptionMedicine]
    notes: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"  # active, expired, cancelled
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
