from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId

class LabTest(BaseModel):
    id: Optional[str] = Field(default=None, alias='_id')
    name: str
    category: str  # blood, urine, imaging, etc.
    price: float
    description: Optional[str] = None
    preparation_required: bool = False
    preparation_instructions: Optional[str] = None
    sample_type: Optional[str] = None  # blood, urine, saliva, etc.
    turnaround_time: Optional[str] = None  # "24 hours", "2-3 days", etc.
    fasting_required: bool = False
    home_collection_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class LabTestBooking(BaseModel):
    id: Optional[str] = Field(default=None, alias='_id')
    user_id: str
    test_ids: List[str]
    test_names: List[str]
    total_price: float
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    scheduled_date: datetime
    scheduled_time: str
    collection_type: str = "home"  # home, lab
    address: Optional[str] = None
    contact_number: str
    status: str = "pending"  # pending, confirmed, sample_collected, processing, completed, cancelled
    payment_status: str = "pending"  # pending, paid, failed
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
