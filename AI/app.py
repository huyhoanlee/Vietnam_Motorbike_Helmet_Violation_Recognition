# main.py
import asyncio
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, AnyUrl, validator
import uuid
from contextlib import asynccontextmanager
import time
from loguru import logger
import base64
from src.services.stream_service import StreamService
from src.models.schema import AIResult
from src.extractors.service import VehicleInfoExtractor
from src.extractors.model import VehicleInfo, CitizenInfo, ImageBase64Request


license_extractor = VehicleInfoExtractor()
class CameraInput(BaseModel):
    camera_id: str
    
# Global service instances
stream_service = None
ai_service = None

class CameraURL(BaseModel):
    url: str
    
    @validator('url')
    def validate_url(cls, v):
        # Basic URL validation
        if not v.startswith(('rtsp://', 'http://', 'https://')):
            raise ValueError('URL must start with rtsp://, http://, or https://')
        return v

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup: Initialize services
    global stream_service
    logger.info("Initializing services...")
    
    stream_service = StreamService()
    
    # Start background processing task
    asyncio.create_task(stream_service.process_streams())
    
    yield
    
    # Cleanup: Release resources when application shuts down
    logger.info("Shutting down services...")
    await stream_service.shutdown()

# Initialize FastAPI app
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """API health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/result", response_model=AIResult)
async def get_result():
    """Get the latest AI processing results"""
    result = stream_service.get_latest_result()
    if not result:
        return {"time": time.time(), "device_list": []}
    
    # Create a copy without frame data to reduce response size
    serializable_result = result.copy()
    if serializable_result.get("device_list"):
        for device in serializable_result["device_list"]:
            device.post_frame = base64.b64encode(device.post_frame).decode("utf-8")
    
    return jsonable_encoder(serializable_result)

@app.post("/result")
async def get_result_by_camera_id(input: CameraInput):
    # Kiểm tra camera_id hợp lệ
    camera_id = input.camera_id
    if not stream_service.is_valid_camera_id(camera_id):
        raise HTTPException(status_code=404, detail=f"Stream ID {camera_id} not found")
    
    # Lấy kết quả mới nhất cho camera_id
    result = stream_service.get_latest_result_camera_id(camera_id)
    
    # Nếu không có kết quả, trả về mặc định
    if not result:
        return {"time": time.time(), "device_list": []}
    
    # Tạo bản sao kết quả để xử lý dữ liệu frame
    serializable_result = result.copy()
    if serializable_result.get("device_list"):
        for device in serializable_result["device_list"]:
            # Mã hóa frame thành base64 nếu có
            if hasattr(device, "post_frame") and device.post_frame is not None:
                device.post_frame = base64.b64encode(device.post_frame).decode("utf-8")
    return jsonable_encoder(serializable_result)

@app.post("/cameras", status_code=status.HTTP_201_CREATED)
async def add_camera(
    camera: CameraURL, 
    background_tasks: BackgroundTasks,
    
):
    """Add a new camera stream to the system"""
    try:
        stream_id, rtsp_stream = await stream_service.add_stream(camera.url)
        background_tasks.add_task(stream_service.initialize_stream, camera.url)
        
        return {
            "message": "Camera added successfully",
            "camera_id": stream_id,
            "stream_url": rtsp_stream
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/cameras/{camera_url:path}", status_code=status.HTTP_200_OK)
async def remove_camera(camera_url: str):
    """Remove a camera stream from the system"""
    try:
        await stream_service.remove_stream(camera_url)
        return {"message": "Camera removed successfully"}
    except KeyError:
        raise HTTPException(status_code=404, detail="Camera URL not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove camera: {str(e)}")

@app.get("/cameras")
async def list_cameras():
    """List all active camera streams"""
    cameras = stream_service.get_all_streams()
    return {
        "count": len(cameras),
        "cameras": cameras
    }

@app.get("/stream/{stream_id}")
async def stream_video(stream_id: str):
    """Stream video for a specific camera"""
    if not stream_service.is_valid_stream_id(stream_id):
        raise HTTPException(status_code=404, detail="Stream not found")
        
    return StreamingResponse(
        stream_service.generate_frames(stream_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.post("/ai/config")
async def update_ai_config(config: dict):
    """Update AI service configuration"""
    try:
        await ai_service.update_config(config)
        return {"message": "AI configuration updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/extract-license-info", response_model=VehicleInfo)
async def extract_license_info(request: ImageBase64Request):
    try:
        res = await license_extractor.ainvoke_vihicle(request.image_base64)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-citizen-info", response_model=CitizenInfo)
async def extract_license_info(request: ImageBase64Request):
    try:
        res = await license_extractor.ainvoke_c(request.image_base64)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)