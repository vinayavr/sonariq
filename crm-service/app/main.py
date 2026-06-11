from fastapi import FastAPI

from app.api.segments import router as segments_router

app = FastAPI(title="SonarIQ CRM")

app.include_router(segments_router, prefix="/segments", tags=["segments"])

@app.get("/")
def health_check():
    return {
        "status": "running",
        "service": "SonarIQ CRM"
    }