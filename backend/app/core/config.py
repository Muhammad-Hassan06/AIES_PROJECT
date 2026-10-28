import os
from pydantic import BaseModel
from dotenv import load_dotenv

_current_dir = os.path.dirname(os.path.abspath(__file__))

def reload_env():
    load_dotenv()
    load_dotenv(os.path.join(_current_dir, "..", "..", ".env"), override=True)
    load_dotenv(os.path.join(_current_dir, "..", "..", "..", ".env"), override=True)

reload_env()

def get_data_dir() -> str:
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/data")),
        os.path.abspath(os.path.join(os.getcwd(), "data")),
        os.path.abspath(os.path.join(os.getcwd(), "backend/data")),
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    # Fallback to standard relative
    target = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    os.makedirs(target, exist_ok=True)
    return target

class Settings(BaseModel):
    PROJECT_NAME: str = "CyberShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Multi-provider LLM Settings
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")

    # Discovery & Exposure Providers
    DISCOVERY_SEARCH_PROVIDER: str = os.getenv("DISCOVERY_SEARCH_PROVIDER", "")
    DISCOVERY_SEARCH_API_KEY: str = os.getenv("DISCOVERY_SEARCH_API_KEY", "")
    EXPOSURE_CHECK_PROVIDER: str = os.getenv("EXPOSURE_CHECK_PROVIDER", "")
    EXPOSURE_CHECK_API_KEY: str = os.getenv("EXPOSURE_CHECK_API_KEY", "")

    # Privacy Protection & Keyed HMAC
    HMAC_SECRET_KEY: str = os.getenv("HMAC_SECRET_KEY", "cybershield_dfsd_local_keyed_hmac_secret_2026")

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

    @property
    def GROQ_API_KEY(self) -> str:
        reload_env()
        return os.getenv("GROQ_API_KEY", "")

    @property
    def OPENAI_API_KEY(self) -> str:
        reload_env()
        return os.getenv("OPENAI_API_KEY", "")

    @property
    def ANTHROPIC_API_KEY(self) -> str:
        reload_env()
        return os.getenv("ANTHROPIC_API_KEY", "")

settings = Settings()

