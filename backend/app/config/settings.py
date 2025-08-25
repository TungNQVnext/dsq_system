"""
Application configuration settings
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
backend_env_path = Path(__file__).resolve().parent.parent.parent / "backend" / ".env"
frontend_env_path = Path(__file__).resolve().parent.parent.parent / "frontend" / ".env"


class Settings:
    """Application settings"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./dsq.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://192.168.137.1:5173",
        "http://192.168.1.107:5173"
    ]
    
    # API
    API_PREFIX: str = "/api/v1"
    
    # Print Settings
    THERMAL_PRINTER_NAME: str = None
    
    @property
    def backend_env_path(self):
        return backend_env_path
    
    @property 
    def frontend_env_path(self):
        return frontend_env_path


settings = Settings()
