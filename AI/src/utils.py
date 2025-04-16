from typing import List, Optional
import cv2
import base64
import torch
import requests
import numpy as np
from loguru import logger
from src.config import Message
from src.models.base_model import DeviceDetection, FrameData, DetectedResult, ViolationType
from concurrent.futures import ThreadPoolExecutor
from src.config.globalVariables import capture_dict, THRESHOLD_PALATE
from datetime import datetime

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

def process_to_output_json(grouped_json, frame, post_frame, camera_id: str="") -> DeviceDetection:
    """
    Convert the grouped vehicle and object information into a format suitable for outputting.

    Args:
        grouped_json (list): List of dictionaries, each containing a vehicle and its associated objects.
        frame (numpy array): Original video frame.

    Returns:
        dict: JSON output with detected vehicles and violations.
    """
    output_json = DeviceDetection(
        camera_id= camera_id,
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
            plate_conf = None
            
            for obj in group["objects"]:
                if obj["class"] == 2:
                    violation = ViolationType.NO_HELMET
                elif obj["class"] == 3 and "plate_number" in obj:
                    plate_number = obj["plate_number"]
                    plate_conf = obj.get("plate_conf", -1)
            
            if plate_conf is None or plate_conf < THRESHOLD_PALATE:
                continue
            
            output_json["detected_result"].append(DetectedResult(
            vehicle_id=f"{datetime.now().strftime('%Y-%m-%d')}_id_{vehicle_id}",
            image=encode_image_to_string(vehicle_img),
            violation=violation,
            plate_numbers=plate_number,
            time=datetime.now().isoformat(),
            plate_conf=float(plate_conf) if plate_conf is not None else 0.0,
            camera_id=camera_id,
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

def fully_optimized_mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results, device):
    """
    Optimized version of mapping_tracked_vehicles function.

    Args:
        vehicle_track_dets (torch.Tensor): Tensor of vehicle bounding boxes
        vehicle_track_ids (list): List of vehicle track IDs
        detection_results (torch.Tensor): All detections
        device (str): Device to run computations on

    Returns:
        list: List of dictionaries with vehicles and their associated objects
    """
    # Ensure inputs are on the right device
    if not isinstance(vehicle_track_dets, torch.Tensor):
        vehicle_track_dets = torch.tensor(vehicle_track_dets, device=device)
    if not isinstance(detection_results, torch.Tensor):
        detection_results = torch.tensor(detection_results, device=device)

    # Separate vehicle and non-vehicle objects
    other_objects = detection_results[detection_results[:, 5] != 0]

    # If no vehicles or no other objects, return empty results
    if len(vehicle_track_dets) == 0 or len(other_objects) == 0:
        return [{"vehicle_id": id, "vehicle_bbox": vehicle[:4].tolist(), "objects": []} 
                for id, vehicle in zip(vehicle_track_ids, vehicle_track_dets)]

    # Pre-filtering: create a spatial index for quick overlap checks
    # Use a simple grid-based approach for demonstration
    # In a production system, consider using libraries like PyTorch3D or custom CUDA kernels

    grouped = []

    # Process in batches to avoid memory issues with large datasets
    batch_size = min(100, len(vehicle_track_dets))  # Adjust based on available memory

    for batch_start in range(0, len(vehicle_track_dets), batch_size):
        batch_end = min(batch_start + batch_size, len(vehicle_track_dets))
        batch_vehicles = vehicle_track_dets[batch_start:batch_end]
        batch_ids = vehicle_track_ids[batch_start:batch_end]

        # Quick filtering using vectorized operations
        v_min_xy = batch_vehicles[:, :2].unsqueeze(1)  # [batch, 1, 2]
        v_max_xy = batch_vehicles[:, 2:4].unsqueeze(1)  # [batch, 1, 2]

        o_min_xy = other_objects[:, :2].unsqueeze(0)  # [1, num_objects, 2]
        o_max_xy = other_objects[:, 2:4].unsqueeze(0)  # [1, num_objects, 2]

        # Check for potential overlaps (vectorized)
        overlap_check = (
            (v_max_xy[:, :, 0] >= o_min_xy[:, :, 0]) &  # vehicle_xmax >= object_xmin
            (v_min_xy[:, :, 0] <= o_max_xy[:, :, 0]) &  # vehicle_xmin <= object_xmax
            (v_max_xy[:, :, 1] >= o_min_xy[:, :, 1]) &  # vehicle_ymax >= object_ymin
            (v_min_xy[:, :, 1] <= o_max_xy[:, :, 1])    # vehicle_ymin <= object_ymax
        )  # [batch, num_objects]

        # Now compute CIP and HHB only for potentially overlapping pairs
        for i, (v_id, vehicle) in enumerate(zip(batch_ids, batch_vehicles)):
            potential_obj_indices = torch.where(overlap_check[i])[0]

            if len(potential_obj_indices) == 0:
                # No potentially overlapping objects for this vehicle
                grouped.append({
                    "vehicle_id": v_id,
                    "vehicle_bbox": vehicle[:4].tolist(),
                    "objects": []
                })
                continue

            # Get potential objects
            pot_objects = other_objects[potential_obj_indices]

            # Calculate CIP for potential objects (vectorized)
            v_bbox = vehicle[:4].unsqueeze(0)  # [1, 4]
            o_bboxes = pot_objects[:, :4]      # [n_pot, 4]

            # Intersection calculation
            inter_xmin = torch.maximum(v_bbox[:, 0].unsqueeze(1), o_bboxes[:, 0].unsqueeze(0))
            inter_ymin = torch.maximum(v_bbox[:, 1].unsqueeze(1), o_bboxes[:, 1].unsqueeze(0))
            inter_xmax = torch.minimum(v_bbox[:, 2].unsqueeze(1), o_bboxes[:, 2].unsqueeze(0))
            inter_ymax = torch.minimum(v_bbox[:, 3].unsqueeze(1), o_bboxes[:, 3].unsqueeze(0))

            inter_width = torch.clamp(inter_xmax - inter_xmin, min=0)
            inter_height = torch.clamp(inter_ymax - inter_ymin, min=0)
            inter_area = (inter_width * inter_height).squeeze(0)  # [n_pot]

            # Object areas
            obj_area = (o_bboxes[:, 2] - o_bboxes[:, 0]) * (o_bboxes[:, 3] - o_bboxes[:, 1])  # [n_pot]

            # CIP calculation
            cip = inter_area / obj_area  # [n_pot]

            # HHB calculation
            v_height = vehicle[3] - vehicle[1]  # scalar
            obj_center_y = (o_bboxes[:, 1] + o_bboxes[:, 3]) / 2  # [n_pot]
            hhb = (obj_center_y - vehicle[1]) / v_height  # [n_pot]

            # Get object classes
            o_classes = pot_objects[:, 5]  # [n_pot]

            # Apply filtering conditions
            valid_helmet = ((o_classes == 1) | (o_classes == 2)) & (cip > 0.947) & (hhb >= 0) & (hhb <= 0.29)
            valid_license = (o_classes == 3) & (cip > 0.947) & (hhb >= 0.64) & (hhb <= 1)
            valid_mask = valid_helmet | valid_license  # [n_pot]

            # Get final valid objects
            valid_indices = torch.where(valid_mask)[0]

            inside_objects = []
            for idx in valid_indices:
                obj_idx = potential_obj_indices[idx]
                obj = other_objects[obj_idx]
                inside_objects.append({
                    "class": int(obj[5].item()),
                    "bbox": obj[:4].tolist(),
                    "confidence": float(obj[4].item())
                })

            grouped.append({
                "vehicle_id": v_id,
                "vehicle_bbox": vehicle[:4].tolist(),
                "objects": inside_objects
            })

    return grouped
 