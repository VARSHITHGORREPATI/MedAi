from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    
class Order(BaseModel):
    id: Optional[str] = Field(default=None, alias='_id')
    user_id: str
    order_number: str
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"  # pending, confirmed, processing, shipped, delivered, cancelled
    payment_status: str = "pending"  # pending, paid, failed, refunded
    payment_method: Optional[str] = None
    shipping_address: dict
    prescription_url: Optional[str] = None
    requires_prescription: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
