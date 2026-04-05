from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.prepare import router as prepare_router

app = FastAPI(title="AI Interviewer API")
app.include_router(health_router)
app.include_router(prepare_router)
