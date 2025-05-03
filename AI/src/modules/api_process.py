import requests
from src.config import API
from loguru import logger
from typing import List
from src.models.base_model import DeviceDetection, DetectedResult
from src.config.globalVariables import frames, urls_camera
import time
import aiohttp, asyncio

def create_violation_process(detected_result: List[DetectedResult], camera_id: str):
    post_be_data = []
    for detection in detected_result:
        violation_data = {
            "camera_input_url": f"{camera_id}",
            "tracking_id": f"{detection.vehicle_id}",
            "violate_image": f"{detection.image}", #base64
            "plate_number": f"{detection.plate_numbers if detection.plate_numbers else None}",
            "confidence": float(detection.plate_conf if detection.plate_conf else 0),
            "status": detection.status,
            "time": f"{detection.time}",
        }
        post_be_data.append(violation_data)
    try:
        if post_be_data:
            time_start = time.time()
            response = requests.post(API.CREATE_VIOLATION, json=post_be_data)
            time_end = time.time()
            logger.info(f"Time taken for POST request: {time_end - time_start} seconds")
            logger.info({"data": [x.get("status") for x in post_be_data], "response": response, "status_code": response.status_code})  
    except Exception as e:
        # logger.error({"data": violation_data["violate_image"][:3], "error": str(e)}) #old
        logger.error({"data": post_be_data, "error": str(e)})
    return

def create_violation_process_async(detected_result: List[DetectedResult], camera_id: str):
    post_be_data = []
    for detection in detected_result:
        violation_data = {
            "camera_input_url": f"{camera_id}",
            "tracking_id": f"{detection.vehicle_id}",
            "violate_image": f"{detection.image}",  #base64
            "plate_number": f"{detection.plate_numbers if detection.plate_numbers else None}",
            "confidence": float(detection.plate_conf if detection.plate_conf else 0),
            "status": detection.status,
            "time": f"{detection.time}",
        }
        post_be_data.append(violation_data)

    async def post_data():
        try:
            time_start = time.time()
            async with aiohttp.ClientSession() as session:
                post_be_data = []
                async with session.post("http://localhost:8080/violation", json=post_be_data) as response:
                    logger.info({
                        "data": [x.get("status") for x in post_be_data],
                        "response": await response.text(),
                        "status_code": response.status
                    })
                    logger.info("ok")
                    time_end = time.time()
                    logger.info(f"Time taken for POST request: {time_end - time_start} seconds")
        except Exception as e:
            logger.error({"data": post_be_data, "error": str(e)})

    if post_be_data:
        asyncio.run(post_data())
    return

def post_process(processed_results: List[DeviceDetection]):
    global frames, urls_camera
    for result in processed_results:
        camera_id = result.camera_id
        detected_result = result.detected_result
        frames[urls_camera.get(camera_id)] = result.post_frame
        create_violation_process(detected_result, camera_id)
