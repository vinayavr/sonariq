from fastapi import FastAPI

from app.api.campaigns import router as campaigns_router
from app.api.segments import router as segments_router

app = FastAPI(title="SonarIQ CRM")

app.include_router(segments_router, prefix="/segments", tags=["segments"])
app.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"])


@app.get("/")
def health_check():
    return {
        "status": "running",
        "service": "SonarIQ CRM",
    }
