from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import datetime as dt
from bson import ObjectId

class VitalSigns(BaseModel):
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_sugar: Optional[float] = None
    oxygen_saturation: Optional[int] = None

class HealthLog(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    date: dt.date = Field(default_factory=dt.date.today)
    vital_signs: Optional[VitalSigns] = None
    symptoms: List[str] = []
    notes: Optional[str] = None
    mood: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class HealthLogCreate(BaseModel):
    date: Optional[dt.date] = None
    vital_signs: Optional[VitalSigns] = None
    symptoms: List[str] = []
    notes: Optional[str] = None
    mood: Optional[str] = None

class HealthAnalysis(BaseModel):
    trends: dict
    alerts: List[str]
    recommendations: List[str]
    risk_score: Optional[float] = None
