from fastapi import FastAPI

from app.api.attribution import router as attribution_router
from app.api.campaigns import router as campaigns_router
from app.api.receipts import router as communications_router
from app.api.segments import router as segments_router

app = FastAPI(title="SonarIQ CRM")

app.include_router(segments_router, prefix="/segments", tags=["segments"])
app.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"])
app.include_router(communications_router, prefix="/communications", tags=["communications"])
app.include_router(attribution_router, tags=["attribution"])


@app.get("/")
def health_check():
    return {
        "status": "running",
        "service": "SonarIQ CRM",
    }
