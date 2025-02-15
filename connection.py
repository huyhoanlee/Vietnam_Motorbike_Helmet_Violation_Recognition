import cv2
import numpy as np
import base64
import time
import threading
from fastapi import FastAPI, BackgroundTasks
from typing import List, Dict
from app.controllers.ai_controller import AIController
from typing import List, Dict, Any
 
# Initialize AI controllers
NUM_AI_CONTROLLERS = 1
ai_controllers = [AIController() for _ in range(NUM_AI_CONTROLLERS)]

app = FastAPI()

# Global variable to store the latest AI output
latest_result = {}
video_urls = []  # Global variable to store the video stream URL
running = False  # Control flag for the background process
sleep_time = 10

def ai_pipeline(video_frames: List[Dict[str, Any]], controllers: List[AIController]) -> List[Dict[str, Any]]:
    """
    Process video frames using AI controllers for object detection or analysis.
   
    Args:
        video_frames: List of video frame data containing:
            - url: str - Path to video file
            - frame: np.ndarray - Video frame data
            - frame_count: int - Current frame number
        controllers: List of AIController instances for processing
       
    Returns:
        List of processed results containing:
            - url: str - Original video path
            - frame: np.ndarray - Processed frame data
           
    Raises:
        AssertionError: If number of controllers doesn't match number of frames
    """
    assert len(controllers) == len(video_frames), "Number of controllers must match number of video frames"
   
    processed_results = []
    for idx, frame_data in enumerate(video_frames):
        processed_frame = controllers[idx].process_frame(
            frame_data["frame"],
            frame_data["frame_count"]
        )
        processed_results.append({
            "url": frame_data["url"],
            "frame": encode_image(processed_frame)
        })
   
    return processed_results

def encode_image(image):
    """Convert an image to a base64-encoded string"""
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

# def ai_pipeline(frames: Dict[str, np.ndarray]) -> Dict:
#     """ Dummy AI processing function (Replace with actual model) """
#     global latest_result, video_urls
#     latest_result =  {
#         "time": "12:21:30",
#         "device_list": []
#     }
#     for url in video_urls:
#         latest_result["device_list"].append(
#             {
#                 'camera_id': url,
#                 "detected_result": []
#             })
#     return latest_result


def get_frames(urls: List[str]) -> List[Dict[str, Any]]:
    """ Capture frames from multiple video streams."""  
    data = []
    for url in urls:
        cap = cv2.VideoCapture(url)
        ret, frame = cap.read()
        cap.release()
        if ret:
            data.append({
                "url": url,
                "frame": frame,
                "frame_count": 0
            })
    return data


def process_video():
    """ Background task: Capture a frame/url every 10s and process it """
    global latest_result, running, video_urls, sleep_time
    while running:
        if video_urls:
            data = get_frames(video_urls)
            if data:
                latest_result = {
                    "time": time.time(),
                    "device_list": ai_pipeline(data, ai_controllers)
                }
        time.sleep(sleep_time)


@app.post("/start")
async def start_processing(background_tasks: BackgroundTasks, urls: List[str] = [], sleep: int = 10):
    """ Start continuous frame processing """
    global video_urls, running, sleep_time, latest_result
    if running:
        return {"message": "Already running"}
    
    video_urls = urls
    sleep_time = max(1, sleep)
    running = True
    background_tasks.add_task(process_video)
    return {"message": "Processing started"}


@app.post("/stop")
async def stop_processing():
    """ Stop continuous frame processing """
    global running, latest_result
    running = False
    latest_result =  'Processing stopped'
    return {"message": "Processing stopped"}


@app.get("/result")
async def get_result():
    """ Get the latest AI result """
    return latest_result



@app.post("/push_url")
async def push_url(url: str):
    """Add a new video stream URL to the list."""
    global video_urls
    if url not in video_urls:
        video_urls.append(url)
        return {"message": "URL added", "urls": video_urls}
    return {"message": "URL already exists", "urls": video_urls}


@app.post("/delete_url")
async def delete_url(url: str):
    """Remove a URL from the list."""
    global video_urls
    if url in video_urls:
        video_urls.remove(url)
        return {"message": "URL removed", "urls": video_urls}
    return {"message": "URL not found", "urls": video_urls}


@app.get("/get_url")
async def get_urls():
    """Retrieve the list of currently tracked video stream URLs."""
    return {"urls": video_urls}