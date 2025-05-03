import uuid
import time
import asyncio
import threading
from fastapi import FastAPI, HTTPException
from typing import List, Dict
from fastapi.encoders import jsonable_encoder
from loguru import logger

from src.utils import get_frames, get_frame_from_url, encode_image_to_bytes
from src.modules.ai_service import AI_Service
from src.modules.api_process import post_process
from src.config import AppConfig
from starlette.responses import StreamingResponse
from src.models.base_model import DeviceDetection, FrameData
from src.config.globalVariables import capture_dict, frames, urls_camera
from concurrent.futures import ThreadPoolExecutor
import queue
from src.extractors.service import InfoExtractor
from src.extractors.model import VehicleInfo, CitizenInfo, ImageBase64Request


extractor = InfoExtractor()
app = FastAPI()

# Global variables
sleep = 1
max_workers = 4
input_frames_queue = {}

# Initialize AI service (uncomment if needed)
# onnx, float16. triton 


def ai_pipeline(AI_service, frame_data: List[FrameData]) -> List[DeviceDetection]:
    """Process video frames using AI controllers."""
    processed_results = []
    result_json = AI_service.process_frame(frame_data["frame"], frame_data["frame_count"], verbose=False)
    result_json.camera_id = frame_data.url
    processed_results.append(
        result_json
        )
    post_process(processed_results)
    return processed_results

def process_one_url(url_input: str, stream_name):
    """Continuously capture frames, process them, and broadcast results."""
    global urls_camera, sleep
    AI_service = AI_Service() 
    while True:
        if urls_camera:
            input_data = get_frame_from_url(url_input)
            input_frames_queue[stream_name] = input_data["frame"]
            # print(input_frames_queue[stream_name].qsize())
            try:
                dm = ai_pipeline(AI_service, input_data)
                pass
            except Exception as e:
                logger.info("Error processing URL in AI Service: ", e)
        else:
            continue

@app.post("/push_url")
async def push_url(url: str):
    """Add a new video stream URL to the list."""
    global urls_camera
    if url not in urls_camera:
        stream_name = uuid.uuid5(uuid.NAMESPACE_URL, url).hex[:8]
        urls_camera[url] = stream_name #{hanaxuan: a343sd}
        rtsp_stream = f"{AppConfig.HOST_STREAM}{stream_name}"
        input_frames_queue[stream_name] = 1 #queue.Queue(maxsize=50)
        threading.Thread(target=process_one_url, args=(url, stream_name), daemon=True).start()
        return {"message": "URL added", "urls": urls_camera, "url": rtsp_stream}
    rtsp_stream = f"{AppConfig.HOST_STREAM}{urls_camera[url]}"
    return {"message": "URL already exists", "urls": urls_camera, "url": rtsp_stream} #f'https://hanaxuan-ai-service.hf.space/stream/{urls_camera[url]}' 

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
        # print(input_frames_queue.get(id).get_nowait().shape)
            frame = input_frames_queue.get(id)#.get_nowait()
            frame_bytes = encode_image_to_bytes(frame)
            if not frame_bytes:
                break
            yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.post("/extract-license-info", response_model=VehicleInfo)
async def extract_license_info(request: ImageBase64Request):
    try:
        res = await extractor.ainvoke_vihicle(request.image_base64)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-citizen-info", response_model=CitizenInfo)
async def extract_license_info(request: ImageBase64Request):
    try:
        res = await extractor.ainvoke_citizen(request.image_base64)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)