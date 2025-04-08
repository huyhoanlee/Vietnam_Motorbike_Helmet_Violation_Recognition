import numpy as np
import time
import asyncio
from fastapi import FastAPI, BackgroundTasks
from typing import List, Dict, Any
import imageio.v3 as iio

from src.utils import encode_image, get_frames

from src.modules.ai_service import AI_Service

# Initialize AI service
AI_service = AI_Service()

app = FastAPI()

# Global variables
latest_result = {}
video_urls = []  # List of video URLs
running = False  # Processing flag
sleep_time = 10

def ai_pipeline(video_frames: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process video frames using AI controllers."""
    processed_results = []
    for _, frame_data in enumerate(video_frames):
        result_json = AI_service.process_frame(frame_data["frame"], frame_data["frame_count"])
        processed_results.append(
            result_json
            )
    return processed_results


async def process_video():
    """Continuously capture frames and process them."""
    global latest_result, running, video_urls, sleep_time
    while running:
        if video_urls:
            data = get_frames(video_urls)
            if data:
                latest_result = {
                    "time": time.time(),
                    "device_list": ai_pipeline(data)
                }
        await asyncio.sleep(sleep_time)


@app.post("/start")
async def start_processing(background_tasks: BackgroundTasks, urls: List[str] = [], sleep: int = 10):
    """Start continuous frame processing."""
    global video_urls, running, sleep_time
    if running:
        return {"message": "Already running"}

    video_urls = urls
    sleep_time = max(1, sleep)
    running = True
    background_tasks.add_task(process_video)
    return {"message": "Processing started"}


@app.post("/stop")
async def stop_processing():
    """Stop continuous frame processing."""
    global running, latest_result
    running = False
    latest_result = {"message": "Processing stopped"}
    return {"message": "Processing stopped"}


@app.get("/result")
async def get_result():
    """Get the latest AI result."""
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

# Define input video path
input_video_path = "MVI_0334.MOV"  # Change this to your video file

# Open the input video
cap = cv2.VideoCapture(input_video_path)

# Get video properties
fps = int(cap.get(cv2.CAP_PROP_FPS))  # Frames per second
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Start processing
total_start_time = time.time()
frame_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break  # Stop when video ends

    # Measure processing time per frame
    start_time = time.time()
    result_json = AI_service.process_frame(frame, frame_count)
    end_time = time.time()

    # Show processed frame
    cv2.imshow("Processed Video", result_json["post_frame"])

    # Print frame processing time
    print(f"Processed frame {frame_count+1}/{total_frames} in {end_time - start_time:.4f} seconds")

    frame_count += 1

    # Press 'q' to exit early
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()

# End total processing timer
total_end_time = time.time()
total_time = total_end_time - total_start_time

print(f"\nTotal processing time: {total_time:.4f} seconds")
print(f"Processed {frame_count} frames.")
