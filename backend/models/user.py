from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from enum import Enum

class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    email: EmailStr
    name: str
    profile_picture: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    mobile: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None  # male, female, other
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg

class UserCreate(UserBase):
    password: Optional[str] = None
    google_id: Optional[str] = None
    role: Optional[UserRole] = UserRole.PATIENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str = Field(alias="_id")
    role: UserRole
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class User(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    password_hash: Optional[str] = None
    google_id: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class GoogleAuthRequest(BaseModel):
    credential: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
