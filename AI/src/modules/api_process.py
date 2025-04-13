import requests
from src.config import API
from loguru import logger
from typing import List
from src.models.base_model import DeviceDetection, DetectedResult
from src.config.globalVariables import frames, urls_camera

def create_violation_process(detected_result: List[DetectedResult], camera_id: str):
    for detection in detected_result:
        violation_data = {
            "tracking_id": detection.vehicle_id,
            "plate_number": detection.plate_numbers if detection.plate_numbers else "None",
            "camera_id": camera_id,
            "status": "AI detected",
            "image_url": detection.image,
            "time": detection.time if detection.time else "None",
            "confidence": detection.plate_conf if detection.plate_conf else -1,
        }
        try:
            response = requests.post(API.CREATE_VIOLATION, json=violation_data)
            logger.info({"data": violation_data["image_url"][:3], "response": response, "status_code": response.status_code})
        except Exception as e:
            logger.error({"data": violation_data["image_url"][:3], "error": str(e)})
    return

def post_process(processed_results: List[DeviceDetection]):
    global frames, urls_camera
    for result in processed_results:
        camera_id = result.camera_id
        detected_result = result.detected_result
        frames[urls_camera.get(camera_id)] = result.post_frame
        create_violation_process(detected_result, camera_id)
