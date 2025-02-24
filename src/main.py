from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .services.violation_service import ViolationService
from typing import List
import uvicorn

app = FastAPI(
    title="Helmet and License Plate Detection API",
    description="API for detecting helmet usage and recognizing license plates",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = ViolationService()

@app.post("/process-image/", tags=["Detection"])
async def process_image(file: UploadFile = File(...)):
    """Process uploaded image for violations"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_data = await file.read()
        result = service.process_image(image_data)
        return {
            "message": "Image processed successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/violations/", tags=["Violations"])
async def get_violations(limit: int = 100, offset: int = 0):
    """Get list of violations"""
    try:
        return service.get_violations(limit, offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/violations/{violation_id}", tags=["Violations"])
async def get_violation(violation_id: int):
    """Get single violation by ID"""
    try:
        violation = service.get_violation(violation_id)
        if not violation:
            raise HTTPException(status_code=404, detail="Violation not found")
        return violation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/violations/{violation_id}/status", tags=["Violations"])
async def update_violation_status(violation_id: int, status: str):
    """Update violation status"""
    try:
        success = service.update_violation_status(violation_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Violation not found")
        return {"message": "Status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
