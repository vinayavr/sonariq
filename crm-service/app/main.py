from fastapi import FastAPI

from app.api.analytics import router as analytics_router
from app.api.attribution import router as attribution_router
from app.api.campaigns import router as campaigns_router
from app.api.chat import router as chat_router
from app.api.receipts import router as communications_router
from app.api.segments import router as segments_router

app = FastAPI(title="SonarIQ CRM")

app.include_router(segments_router, prefix="/segments", tags=["segments"])
app.include_router(campaigns_router, prefix="/campaigns", tags=["campaigns"])
app.include_router(communications_router, prefix="/communications", tags=["communications"])
app.include_router(attribution_router, tags=["attribution"])
app.include_router(analytics_router, tags=["analytics"])
app.include_router(chat_router, tags=["chat"])


@app.get("/")
def health_check():
    return {
        "status": "running",
        "service": "SonarIQ CRM",
    }
