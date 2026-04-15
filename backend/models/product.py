from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class Product(BaseModel):
    id: Optional[str] = Field(default=None, alias='_id')
    name: str
    category: str  # medicine, supplement, medical_device, etc.
    price: float
    original_price: Optional[float] = None
    stock: int = 0
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    requires_prescription: bool = False
    image_url: Optional[str] = None
    dosage_form: Optional[str] = None  # tablet, capsule, syrup, etc.
    strength: Optional[str] = None
    pack_size: Optional[str] = None
    rating: float = 0.0
    reviews_count: int = 0
    in_stock: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
