from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from config.database import get_database
from middleware.auth import get_current_user
from models.order import Order, OrderItem
from bson import ObjectId
import random
import string

router = APIRouter()

def generate_order_number():
    """Generate a unique order number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    random_str = ''.join(random.choices(string.digits, k=6))
    return f"ORD{timestamp}{random_str}"

@router.post("/")
async def create_order(
    order: Order,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new order"""
    try:
        user_id = str(current_user["_id"])
        
        # Generate order number
        order_number = generate_order_number()
        
        order_dict = order.dict(by_alias=True, exclude={"id"})
        order_dict["user_id"] = user_id
        order_dict["order_number"] = order_number
        order_dict["created_at"] = datetime.utcnow()
        order_dict["updated_at"] = datetime.utcnow()
        
        result = await db.orders.insert_one(order_dict)
        
        return {
            "success": True,
            "message": "Order placed successfully",
            "order_id": str(result.inserted_id),
            "order_number": order_number
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating order: {str(e)}"
        )

@router.get("/")
async def get_user_orders(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all orders for current user"""
    try:
        user_id = str(current_user["_id"])
        
        cursor = db.orders.find({"user_id": user_id}).sort("created_at", -1)
        orders = await cursor.to_list(length=100)
        
        for order in orders:
            order["_id"] = str(order["_id"])
        
        return {
            "success": True,
            "data": orders
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching orders: {str(e)}"
        )

@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a specific order"""
    try:
        user_id = str(current_user["_id"])
        
        order = await db.orders.find_one({
            "_id": ObjectId(order_id),
            "user_id": user_id
        })
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        order["_id"] = str(order["_id"])
        return {
            "success": True,
            "data": order
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching order: {str(e)}"
        )

@router.post("/upload-prescription")
async def upload_prescription(
    order_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upload prescription for an order"""
    try:
        user_id = str(current_user["_id"])
        
        # Verify order belongs to user
        order = await db.orders.find_one({
            "_id": ObjectId(order_id),
            "user_id": user_id
        })
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size (max 5MB)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 5MB limit"
            )
        
        prescription_info = {
            "filename": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "uploaded_at": datetime.utcnow()
        }
        
        # Update order with prescription info
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "prescription_url": f"prescriptions/{order_id}/{file.filename}",
                    "prescription_info": prescription_info,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "success": True,
            "message": "Prescription uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading prescription: {str(e)}"
        )

@router.put("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Cancel an order"""
    try:
        user_id = str(current_user["_id"])
        
        result = await db.orders.update_one(
            {
                "_id": ObjectId(order_id),
                "user_id": user_id,
                "status": {"$in": ["pending", "confirmed"]}
            },
            {
                "$set": {
                    "status": "cancelled",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or cannot be cancelled"
            )
        
        return {
            "success": True,
            "message": "Order cancelled successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling order: {str(e)}"
        )
