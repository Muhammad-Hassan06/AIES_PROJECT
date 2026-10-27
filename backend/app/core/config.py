import os
from pydantic import BaseModel
from dotenv import load_dotenv

_current_dir = os.path.dirname(os.path.abspath(__file__))

def reload_env():
    load_dotenv()
    load_dotenv(os.path.join(_current_dir, "..", "..", ".env"), override=True)
    load_dotenv(os.path.join(_current_dir, "..", "..", "..", ".env"), override=True)

reload_env()

class Settings(BaseModel):
    PROJECT_NAME: str = "CyberShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./backend/data/cybershield.db")
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_IMAGE_EXTENSIONS: set = {".png", ".jpg", ".jpeg", ".webp"}
    SAFE_FETCH_ENABLED: bool = os.getenv("SAFE_FETCH_ENABLED", "false").lower() == "true"
    PKCERT_REPORT_URL: str = "https://pkcert.gov.pk/report-incident/"
    NCCIA_PORTAL_URL: str = "https://complaint.nccia.gov.pk/"
    NCCIA_WEBSITE_URL: str = "https://www.nccia.gov.pk/"

    @property
    def GEMINI_API_KEY(self) -> str:
        reload_env()
        return os.getenv("GEMINI_API_KEY", "")

settings = Settings()
