from fastapi import APIRouter, HTTPException, status, Depends
import bcrypt
import random
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from bson import ObjectId
from datetime import datetime, timedelta

from models.user import UserCreate, UserLogin, UserResponse, GoogleAuthRequest, TokenResponse
from middleware.auth import create_access_token, create_refresh_token, get_current_user
from config.database import get_database
from config.settings import settings
from services.notification_service import NotificationService

router = APIRouter()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hashed password"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user with email and password"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = {
        "email": user_data.email,
        "name": user_data.name,
        "profile_picture": user_data.profile_picture,
        "password_hash": hash_password(user_data.password) if user_data.password else None,
        "role": user_data.role,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    # Generate tokens
    access_token = create_access_token({"sub": str(result.inserted_id), "email": user_data.email, "role": user_data.role})
    refresh_token = create_refresh_token({"sub": str(result.inserted_id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse(**user_dict)
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    db = get_database()
    
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate tokens
    user_id = str(user["_id"])
    user_role = user.get("role", "patient")
    access_token = create_access_token({"sub": user_id, "email": user["email"], "role": user_role})
    refresh_token = create_refresh_token({"sub": user_id})
    
    user["_id"] = user_id
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse(**user)
    }

@router.post("/google", response_model=TokenResponse)
async def google_auth(auth_data: GoogleAuthRequest):
    """Authenticate with Google OAuth"""
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            auth_data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Get user info from Google
        google_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")
        
        db = get_database()
        
        # Find or create user
        user = await db.users.find_one({"$or": [{"google_id": google_id}, {"email": email}]})
        
        if user:
            # Update existing user
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "google_id": google_id,
                        "profile_picture": picture,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            user_id = str(user["_id"])
            user["_id"] = user_id  # Convert ObjectId to string for Pydantic validation
        else:
            # Create new user
            user_dict = {
                "email": email,
                "name": name,
                "profile_picture": picture,
                "google_id": google_id,
                "role": "patient",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await db.users.insert_one(user_dict)
            user_id = str(result.inserted_id)
            user = user_dict
            user["_id"] = user_id
        
        # Generate tokens
        user_role = user.get("role", "patient")
        access_token = create_access_token({"sub": user_id, "email": email, "role": user_role})
        refresh_token = create_refresh_token({"sub": user_id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": UserResponse(**user)
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token. Please check your Google OAuth configuration. Error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    current_user["_id"] = str(current_user["_id"])
    return UserResponse(**current_user)

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client should remove token)"""
    return {"message": "Logged out successfully"}

@router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's profile information"""
    db = get_database()
    user_id = current_user["_id"]
    
    # Fields that can be updated
    allowed_fields = ["name", "mobile", "location", "date_of_birth", "gender", "height", "weight", "profile_picture"]
    update_data = {}
    
    for field in allowed_fields:
        if field in profile_data:
            update_data[field] = profile_data[field]
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    # Add updated timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Update user profile
    result = await db.users.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Fetch updated user
    updated_user = await db.users.find_one({"_id": user_id})
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "_id": str(updated_user["_id"]),
            "email": updated_user["email"],
            "name": updated_user["name"],
            "role": updated_user["role"],
            "mobile": updated_user.get("mobile"),
            "location": updated_user.get("location"),
            "date_of_birth": updated_user.get("date_of_birth"),
            "gender": updated_user.get("gender"),
            "height": updated_user.get("height"),
            "weight": updated_user.get("weight"),
            "profile_picture": updated_user.get("profile_picture"),
            "created_at": updated_user["created_at"],
            "updated_at": updated_user["updated_at"]
        }
    }

@router.put("/profile/health")
async def update_health_profile(
    health_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's health profile"""
    db = get_database()
    user_id = current_user["_id"]
    
    # Update health profile in user document
    result = await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "health_profile": health_data,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "Health profile updated successfully", "data": health_data}

@router.get("/profile/health")
async def get_health_profile(current_user: dict = Depends(get_current_user)):
    """Get user's health profile"""
    db = get_database()
    user_id = current_user["_id"]
    
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    health_profile = user.get("health_profile", {
        "age": "",
        "height": "",
        "weight": "",
        "bloodType": "",
        "allergies": "",
        "chronicConditions": "",
        "heartRate": "",
        "bloodPressureSystolic": "",
        "bloodPressureDiastolic": "",
        "lastCheckup": ""
    })
    
    return {"health_profile": health_profile}


@router.post("/request-otp")
async def request_otp(request: dict):
    """Request OTP for phone-based authentication"""
    mobile = request.get("mobile")
    if not mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number is required"
        )

    db = get_database()

    otp_code = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=10)

    await db.otps.update_one(
        {"mobile": mobile},
        {"$set": {"otp": otp_code, "expiry": expiry, "verified": False}},
        upsert=True
    )

    notification_service = NotificationService()
    await notification_service.send_sms(
        to_phone=mobile,
        message=f"Your MedAI verification code is: {otp_code}. Valid for 10 minutes. Do not share this code."
    )

    if settings.DEBUG:
        return {"message": "OTP sent successfully", "otp": otp_code}
    return {"message": "OTP sent successfully"}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: dict):
    """Verify OTP and return authentication tokens"""
    mobile = request.get("mobile")
    otp_code = request.get("otp")

    if not mobile or not otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number and OTP are required"
        )

    db = get_database()

    otp_record = await db.otps.find_one({"mobile": mobile, "verified": False})

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OTP not found. Please request a new one."
        )

    if datetime.utcnow() > otp_record["expiry"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OTP has expired. Please request a new one."
        )

    if otp_record["otp"] != otp_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP. Please try again."
        )

    await db.otps.update_one({"_id": otp_record["_id"]}, {"$set": {"verified": True}})

    user = await db.users.find_one({"mobile": mobile})

    if not user:
        placeholder_email = f"user_{mobile.strip('+').replace(' ', '')}@medai.local"
        user_dict = {
            "email": placeholder_email,
            "name": f"User {mobile[-4:]}",
            "mobile": mobile,
            "role": "patient",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.users.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        user = user_dict
    else:
        if not user.get("email"):
            user["email"] = f"user_{mobile.strip('+').replace(' ', '')}@medai.local"
        user["_id"] = str(user["_id"])

    user_id = str(user["_id"])
    user_role = user.get("role", "patient")
    email = user.get("email")

    access_token = create_access_token({"sub": user_id, "email": email, "role": user_role})
    refresh_token = create_refresh_token({"sub": user_id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse(**user)
    }
