from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "MedAI Healthcare Platform"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    
    # Database
    MONGODB_URI: str
    DB_NAME: str = "medai"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT Authentication
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/callback"
    
    # AI Provider Configuration
    AI_PROVIDER: str = "gemini"  # Options: "gemini", "huggingface", "openai", "ollama"
    
    # Google Gemini (FREE - Fast & High Quality)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"  # Latest & fastest model
    
    # Hugging Face (FREE)
    HUGGINGFACE_API_KEY: Optional[str] = None
    HUGGINGFACE_MODEL: str = "mistralai/Mixtral-8x7B-Instruct-v0.1"
    
    # OpenAI (Paid)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # Ollama (Local - FREE)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # AWS S3 (Optional for development)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    
    # Twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: Optional[str] = None
    
    # Google Maps
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # Vector Database
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    FAISS_INDEX_PATH: str = "./faiss_index"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
