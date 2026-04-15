from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, time
from bson import ObjectId

class MedicineReminder(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    medicine_name: str
    dosage: str
    frequency: str  # "daily", "twice_daily", "custom"
    times: List[time]
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, time: lambda v: v.isoformat()}

class MedicineReminderCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    times: List[str]  # Time strings like "08:00", "20:00"
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None

class MedicineLog(BaseModel):
    reminder_id: str
    user_id: str
    taken_at: datetime
    status: str  # "taken", "missed", "skipped"
    notes: Optional[str] = None
