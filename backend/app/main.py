import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router
from app.db.database import init_db, list_recent_investigations, save_investigation
from app.agents.orchestrator import orchestrator
from app.models.schemas import InvestigationType

# Pre-defined sample investigations for immediate demonstration
SEED_DEMO_CASES = [
    {
        "input_type": InvestigationType.COMBINED,
        "url": "http://secure-login.hbl-verify.top/auth/session?token=88291",
        "text": "URGENT: Your HBL Bank internet banking session has been suspended due to 3 failed attempts. Enter your 6-digit OTP code immediately at the link above to avoid permanent account freeze.",
        "sender_info": "+92-301-8891029",
        "manual_indicators": ["otp_requested", "urgency", "password_requested"]
    },
    {
        "input_type": InvestigationType.MESSAGE,
        "text": "BISP Alert: Mubarik ho! Aap k 25,000 rupay BISP Benazir Income Support Program mein aagaye hain. Foran call karein 0312-9988112 aur apna CNIC verify karwa k advance delivery fee 1,500 bhejein.",
        "sender_info": "0312-9988112",
        "manual_indicators": ["payment_requested"]
    },
    {
        "input_type": InvestigationType.URL,
        "url": "https://pkcert.gov.pk/advisories",
        "text": "Official PKCERT Security Advisories and Guidance Portal",
        "sender_info": "contact@pkcert.gov.pk",
        "manual_indicators": []
    }
]

# Initialize database tables on import
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure db and seed demo cases if empty
    init_db()
    cases = list_recent_investigations(limit=1)

    if len(cases) == 0:
        print("[CyberShield AI] Seeding initial forensic demonstration cases...")
        for seed in SEED_DEMO_CASES:
            try:
                rep = orchestrator.run_investigation(
                    input_type=seed["input_type"],
                    url=seed.get("url"),
                    text=seed.get("text"),
                    sender_info=seed.get("sender_info"),
                    manual_indicators=seed.get("manual_indicators", [])
                )
                save_investigation(rep.case_id, rep.model_dump())
            except Exception as e:
                print(f"[CyberShield AI] Error seeding demo case: {e}")
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic, Explainable, Multimodal Cyber-Fraud Detection and Investigation Platform",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "product": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tagline": "Investigate smarter. Detect earlier. Stay safer.",
        "docs": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
