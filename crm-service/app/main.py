from fastapi import FastAPI

app = FastAPI(title="SonarIQ CRM")

@app.get("/")
def health_check():
    return {
        "status": "running",
        "service": "SonarIQ CRM"
    }