from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from config.database import get_database
from middleware.auth import get_current_user, require_role
from models.product import Product
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_products(
    category: str = None,
    search: str = None,
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all products with optional filtering"""
    try:
        query = {}
        if category:
            query["category"] = category
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.products.find(query).skip(skip).limit(limit)
        products = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for product in products:
            product["_id"] = str(product["_id"])
        
        return {
            "success": True,
            "data": products
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching products: {str(e)}"
        )

@router.get("/{product_id}")
async def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get a single product by ID"""
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product["_id"] = str(product["_id"])
        return {
            "success": True,
            "data": product
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching product: {str(e)}"
        )

@router.post("/")
async def create_product(
    product: Product,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Create a new product (admin only)"""
    try:
        product_dict = product.dict(by_alias=True, exclude={"id"})
        result = await db.products.insert_one(product_dict)
        
        return {
            "success": True,
            "message": "Product created successfully",
            "product_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating product: {str(e)}"
        )

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    product: Product,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Update a product (admin only)"""
    try:
        product_dict = product.dict(by_alias=True, exclude={"id"})
        product_dict["updated_at"] = datetime.utcnow()
        
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": product_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return {
            "success": True,
            "message": "Product updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating product: {str(e)}"
        )

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(require_role(["admin"])),
    db = Depends(get_database)
):
    """Delete a product (admin only)"""
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return {
            "success": True,
            "message": "Product deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting product: {str(e)}"
        )
