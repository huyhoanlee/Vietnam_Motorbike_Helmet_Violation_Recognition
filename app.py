import cv2
import numpy as np
import base64
import time
import asyncio
import threading
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from typing import List, Dict, Any
from pipeline.controllers.ai_controller import AIController

# Initialize AI controllers
NUM_AI_CONTROLLERS = 1
ai_controllers = [AIController() for _ in range(NUM_AI_CONTROLLERS)]

app = FastAPI()

# Global variables
latest_result = {}
video_urls = []  # List of video URLs
running = False  # Processing flag
sleep_time = 10

# Active WebSocket connections
active_connections: List[WebSocket] = []


class WebSocketManager:
    """Manage active WebSocket connections."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Send message to all connected WebSocket clients."""
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected_clients.append(connection)

        # Remove disconnected clients
        for client in disconnected_clients:
            self.disconnect(client)


# Initialize WebSocket manager
ws_manager = WebSocketManager()


def encode_image(image):
    """Convert an OpenCV frame to a base64-encoded string."""
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')


def get_frames(urls: List[str]) -> List[Dict[str, Any]]:
    """Capture frames from multiple video streams."""
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


def ai_pipeline(video_frames: List[Dict[str, Any]], controllers: List[AIController]) -> List[Dict[str, Any]]:
    """Process video frames using AI controllers."""
    assert len(controllers) == len(video_frames), "Number of controllers must match number of video frames"

    processed_results = []
    for idx, frame_data in enumerate(video_frames):
        processed_frame = controllers[idx].process_frame(
            frame_data["frame"],
            frame_data["frame_count"]
        )
        processed_results.append({
            "url": frame_data["url"],
            "frame": encode_image(processed_frame)  # Encode frame as base64
        })
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
                    "device_list": ai_pipeline(data, ai_controllers)
                }
                # Broadcast to WebSocket clients
                await ws_manager.broadcast(latest_result)
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


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket connection for real-time AI results."""
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
