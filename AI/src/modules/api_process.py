import requests
from src.config import API
from loguru import logger
from typing import List
from src.models.base_model import DeviceDetection, DetectedResult
from src.config.globalVariables import frames, urls_camera

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
        response = requests.post(API.CREATE_VIOLATION, json=post_be_data)
        # logger.info({"data": violation_data["violate_image"][:3], "response": response, "status_code": response.status_code}) #old
        logger.info({"data": post_be_data, "response": response, "status_code": response.status_code})
    except Exception as e:
        # logger.error({"data": violation_data["violate_image"][:3], "error": str(e)}) #old
        logger.error({"data": post_be_data, "error": str(e)})
    return

def post_process(processed_results: List[DeviceDetection]):
    global frames, urls_camera
    for result in processed_results:
        camera_id = result.camera_id
        detected_result = result.detected_result
        frames[urls_camera.get(camera_id)] = result.post_frame
        create_violation_process(detected_result, camera_id)
