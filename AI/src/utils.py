from typing import List, Optional
import cv2
import base64
import requests
import numpy as np
from loguru import logger
from src.config import Message
from src.models.base_model import DeviceDetection, FrameData, DetectedResult, ViolationType
from concurrent.futures import ThreadPoolExecutor
from src.config.globalVariables import capture_dict

def mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results, device="cuda:0"):

    """
    Group objects of class 1 (helmet), 2 (no-helmet), 3 (license plate) with class 0 (vehicle)
    if they are inside the vehicle bounding box.

    Args:
        detections (torch.Tensor): Tensor of shape (N, 6) with [x_min, y_min, x_max, y_max, conf, class_id]
        device (str): Device to run the computation on (default: "cuda:0")

    Returns:
        list: List of dictionaries, each containing a vehicle and its associated objects.
    """
    # vehicles = detection_results[detection_results[:, 5] == 0]  # Get all vehicles (class 0)
    other_objects = detection_results[detection_results[:, 5] != 0]  # Get non-vehicle objects

    grouped = []
    
    for id, vehicle in zip(vehicle_track_ids, vehicle_track_dets):
        v_id = id  # Assign an ID for the vehicle group

        # Find objects inside this vehicle's bounding box
        inside_objects = []
        for obj in other_objects:
            o_xmin, o_ymin, o_xmax, o_ymax, _, obj_class = obj
            class_id = obj_class.item()
            obj_bbox = [o_xmin, o_ymin, o_xmax, o_ymax]
            
            is_valid = False
            cip = calculate_cip(vehicle, obj_bbox)
            hhb = calculate_hhb(vehicle, obj_bbox)
            is_valid = validate_object(class_id, cip, hhb)

            if is_valid:
                inside_objects.append({
                    "class": int(obj_class.item()),
                    "bbox": obj[:4].tolist(),  # Convert to list for easier usage
                    "confidence": float(obj[4].item())
                })

        grouped.append({
            "vehicle_id": v_id,
            "vehicle_bbox": vehicle[:4].tolist(),
            # "confidence": float(vehicle[4].item()),
            "objects": inside_objects
        })

    return grouped

def process_to_output_json(grouped_json, frame, post_frame) -> DeviceDetection:
    """
    Convert the grouped vehicle and object information into a format suitable for outputting.

    Args:
        grouped_json (list): List of dictionaries, each containing a vehicle and its associated objects.
        frame (numpy array): Original video frame.

    Returns:
        dict: JSON output with detected vehicles and violations.
    """
    output_json = DeviceDetection(
        camera_id= '',
        post_frame= encode_image_to_bytes(post_frame),
        detected_result= []
    )

    for group in grouped_json:
        vehicle_id = int(group["vehicle_id"])
        x1, y1, x2, y2 = map(int, group["vehicle_bbox"])  # Convert to integers

        # Crop vehicle image from the frame
        vehicle_img = frame[y1:y2, x1:x2]

        # Check for violation (class 2: no helmet)
        if any(obj["class"] == 2 for obj in group["objects"]):
            violation = None
            plate_number = None

            for obj in group["objects"]:
                if obj["class"] == 2:
                    violation = ViolationType.NO_HELMET
                elif obj["class"] == 3 and "plate_number" in obj:
                    plate_number = obj["plate_number"]
                    
            output_json["detected_result"].append(DetectedResult(
                vehicle_id= vehicle_id,
                image= encode_image_to_string(vehicle_img),
                violation= violation,
                plate_numbers= plate_number
            ))

    return output_json

def encode_image_to_bytes(image) -> bytes:
    """Convert an OpenCV frame to a base64-encoded string."""
    _, buffer = cv2.imencode('.jpg', image)
    return buffer.tobytes()

def encode_image_to_string(image) -> str:
    """Convert an OpenCV frame to a base64-encoded string."""
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')
    
def get_frame_from_url(url: str) -> Optional[FrameData]:
    response = requests.get(url)
    if response.status_code == 200:
        frame_bytes = response.content
        frame = cv2.imdecode(np.frombuffer(frame_bytes, np.uint8), cv2.IMREAD_COLOR)
        if frame is not None:
            data = FrameData(
                url= url,
                frame= frame,
                frame_count= 0
                )
            return data
        else:
            logger.debug(f'Frame is None: {url}')
    else:
        logger.debug(f'{Message.CAMERA_DEATH}: {url}')

def get_frames(urls: List[str]) -> List[FrameData]:
    data = []
    with ThreadPoolExecutor(max_workers=min(len(urls), 10)) as executor:  # Giới hạn số thread để tránh quá tải
        futures = [executor.submit(get_frame_from_url, url) for url in urls]
        data = [future.result() for future in futures if future.result() is not None]
    return data


import torch

def calculate_cip(vehicle_bbox, object_bbox):
    v_xmin, v_ymin, v_xmax, v_ymax = vehicle_bbox
    o_xmin, o_ymin, o_xmax, o_ymax = object_bbox

    # Calculate intersection area
    inter_xmin = max(v_xmin, o_xmin)
    inter_ymin = max(v_ymin, o_ymin)
    inter_xmax = min(v_xmax, o_xmax)
    inter_ymax = min(v_ymax, o_ymax)

    inter_width = max(0, inter_xmax - inter_xmin)
    inter_height = max(0, inter_ymax - inter_ymin)
    inter_area = inter_width * inter_height

    # Calculate object area
    obj_area = (o_xmax - o_xmin) * (o_ymax - o_ymin)
    
    # Calculate CIP
    return inter_area / obj_area if obj_area > 0 else 0

def calculate_hhb(vehicle_bbox, object_bbox):
    v_xmin, v_ymin, v_xmax, v_ymax = vehicle_bbox
    o_ymin, o_ymax = object_bbox[1], object_bbox[3]

    v_height = v_ymax - v_ymin
    obj_center_y = (o_ymin + o_ymax) / 2
    relative_height = (obj_center_y - v_ymin) / v_height if v_height > 0 else 0
    
    return relative_height

def is_inside_bbox(vehicle_bbox, object_bbox):
    v_xmin, v_ymin, v_xmax, v_ymax = vehicle_bbox
    o_xmin, o_ymin, o_xmax, o_ymax = object_bbox
    return v_xmin <= o_xmin and v_ymin <= o_ymin and v_xmax >= o_xmax and v_ymax >= o_ymax

def validate_object(class_id, cip, hhb):
    """
    Kiểm tra xem object có thỏa mãn điều kiện CIP và HHB dựa trên class của nó.

    Args:
        class_id (int): Class ID (1: helmet, 2: no-helmet, 3: license plate)
        cip (float): Giá trị CIP
        hhb (float): Giá trị HHB

    Returns:
        bool: True nếu object thỏa mãn điều kiện, False nếu không
    """
    if class_id in [1, 2]:  # Helmet hoặc no-helmet
        return cip > 0.947 and 0 <= hhb <= 0.29  # Phần trên
    elif class_id == 3:  # License plate
        return cip > 0.947 and 0.64 <= hhb <= 1  # Phần dưới
    return False