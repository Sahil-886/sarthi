import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

# Explicitly load .env file to ensure variables are available to os.environ
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Sarthi"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/sathi_db"
    MONGODB_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CLERK_SECRET_KEY: Optional[str] = None
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Services
    ELEVENLABS_API_KEY: Optional[str] = None
    DID_API_KEY: Optional[str] = None
    
    # Vector Database
    CHROMA_PATH: str = "./chroma_data"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
