import uuid
import time
import asyncio
import threading
from fastapi import FastAPI
from typing import List, Dict
from fastapi.encoders import jsonable_encoder
from loguru import logger

from src.utils import get_frames
from src.modules.ai_service import AI_Service
from src.modules.api_process import post_process
from src.config import AppConfig
from starlette.responses import StreamingResponse
from src.models.base_model import DeviceDetection, FrameData
from src.config.globalVariables import capture_dict, frames, urls_camera

app = FastAPI()

# Global variables
latest_result = {}
sleep = 3

# Initialize AI service (uncomment if needed)
AI_service = AI_Service() # onnx, float16. triton 

# AI_service_streaming = AI_Service()

def ai_pipeline(video_frames: List[FrameData]) -> List[DeviceDetection]:
    """Process video frames using AI controllers."""
    processed_results = []
    for frame_data in video_frames:
        result_json = AI_service.process_frame(frame_data["frame"], frame_data["frame_count"])
        result_json.camera_id = frame_data.url
        processed_results.append(
            result_json
            )
    post_process(processed_results)
    return processed_results

def process_video():
    """Continuously capture frames, process them, and broadcast results."""
    global latest_result, urls_camera, sleep
    while True:
        if urls_camera:
            data = get_frames(list(urls_camera.keys()))
            if data:
                latest_result = {
                    "time": time.time(),
                    "device_list": ai_pipeline(data)
                }
            else:
                time.sleep(sleep)
        else:
            time.sleep(sleep)

threading.Thread(target=process_video, daemon=True).start()

@app.get("/result")
async def get_result():
    """Get the latest AI result (kept for compatibility)."""
    output = latest_result.copy()
    if output:
        for i in range(len(output["device_list"])):
            output["device_list"][i].post_frame = ""
    return jsonable_encoder(output)

@app.post("/push_url")
async def push_url(url: str):
    """Add a new video stream URL to the list."""
    global urls_camera
    if url not in urls_camera:
        stream_name = uuid.uuid5(uuid.NAMESPACE_URL, url).hex[:8]
        urls_camera[url] = stream_name
        rtsp_stream = f"{AppConfig.HOST_STREAM}{stream_name}"
        return {"message": "URL added", "urls": urls_camera, "url": rtsp_stream}
    return {"message": "URL already exists", "urls": urls_camera, "url": urls_camera[url]}

@app.post("/delete_url")
async def delete_url(url: str):
    """Remove a URL from the list."""
    global urls_camera
    if url in urls_camera:
        if url in capture_dict:
            capture_dict[url].release()
            del capture_dict[url]
            
        stream_name = urls_camera.pop(url)
        if stream_name in frames:
            del frames[stream_name]
        return {"message": "URL removed", "urls": urls_camera}
    return {"message": "URL not found", "urls": urls_camera}

@app.get("/get_url")
async def get_urls():
    """Retrieve the list of currently tracked video stream URLs."""
    return urls_camera

@app.get("/stream/{id}")
async def stream_video(id: str):
    def generate_frames():
        while True:
            frame = frames.get(id)
            if not frame:
                break
            # frame = AI_service_streaming.streaming_visualize(frame)
            yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")