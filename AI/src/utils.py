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
from src.config.globalVariables import capture_dict, THRESHOLD_PLATE, THRESHOLD_PLATE_CERTAIN, THRESHOLD_NOHELMET_CERTAIN
from datetime import datetime
from src.models.schema import ViolationStatus
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
            max_nohelmet_conf = group.get("max_nohelmet_conf", -1)
            violation = ViolationType.NO_HELMET
            for obj in group["objects"]:
                if obj["class"] == 3 and "plate_number" in obj:
                    plate_number = obj["plate_number"]
                    plate_conf = obj.get("plate_conf", -1)
                if obj["class"] == 2:
                    nohelmet_conf = obj.get("nohelmet_conf", -1)
                
            if plate_conf is None or plate_conf < THRESHOLD_PLATE:
                continue
            
            line1, line2, status = parse_and_validate_plate(plate_number)
            if status == "certain" and plate_conf > THRESHOLD_PLATE_CERTAIN and max_nohelmet_conf > THRESHOLD_NOHELMET_CERTAIN:
                plate_number = line1 + " " + line2
                status = ViolationStatus.AI_RELIABEL.value
            else:
                status = ViolationStatus.AI_DETECT.value
                status = "AI detected"
                plate_number = plate_number.replace("\n"," ")
                logger.debug(f"Status: {status}, plate number: {plate_number}")
            output_json["detected_result"].append(DetectedResult(
            vehicle_id=f"{datetime.now().strftime('%Y-%m-%d')}_id_{vehicle_id}",
            image=encode_image_to_string(vehicle_img),
            violation=violation,
            plate_numbers=plate_number,
            time=datetime.now().isoformat(),
            plate_conf=float(plate_conf) if plate_conf is not None else 0.0,
            camera_id=camera_id,
            status = status
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
            conf_nohelmet = None
            for idx in valid_indices:
                obj_idx = potential_obj_indices[idx]
                obj = other_objects[obj_idx]
                obj_class = int(obj[5].item())
                obj_confidence = float(obj[4].item())
                
                # Check if this is a nohelmet object and update conf_nohelmet
                if obj_class == 2:  # nohelmet class
                    if conf_nohelmet is None or obj_confidence > conf_nohelmet:
                        conf_nohelmet = obj_confidence
                
                inside_objects.append({
                    "class": obj_class,
                    "bbox": obj[:4].tolist(),
                    "confidence": obj_confidence
                })

            grouped.append({
                "vehicle_id": v_id,
                "vehicle_bbox": vehicle[:4].tolist(),
                "objects": inside_objects,
                "max_nohelmet_conf": conf_nohelmet
            })

    return grouped


# src/utils/video.py
from src.config import AppConfig_2

def compress_frame_to_jpeg(frame: np.ndarray) -> bytes:
    """Compress a frame to JPEG format"""
    success, encoded_frame = cv2.imencode(
        '.jpg', 
        frame, 
        [cv2.IMWRITE_JPEG_QUALITY, AppConfig_2.JPEG_QUALITY]
    )
    
    if not success:
        raise RuntimeError("Failed to encode frame as JPEG")
        
    return encoded_frame.tobytes()


def parse_and_validate_plate(plate_result):
    """
    Parse license plate from frame, post-process and validate against Vietnamese license plate rules.
    
    Returns:
        tuple: (line1, line2, status)
            - line1, line2: Processed text of each line
            - status: "certain" if plate follows rules, "needs_verification" if uncertain
    """
    # Handle cases where there's no newline
    if "\n" not in plate_result:
        cleaned = clean_plate_text(plate_result).upper()
        if len(cleaned) >= 6:
            # Try to split at various points and infer format
            for i in range(3, 6):
                if i < len(cleaned):
                    line1 = cleaned[:i]
                    line2 = cleaned[i:]
                    # Attempt to format line1 and line2
                    line1 = format_line1(line1)
                    line2 = format_line2(line2)
                    if validate_plate_format(line1, line2):
                        return line1, line2, "certain"
        return None, None, "needs_verification"
        
    parts = plate_result.strip().split("\n")
    if len(parts) < 2:
        return None, None, "needs_verification"
        
    line1, line2 = parts[0], parts[1]
    
    if not line1 and not line2:
        return None, None, "needs_verification"
    
    # Post-process to remove invalid characters and format
    line1 = format_line1(clean_plate_text(line1)) if line1 else ""
    line2 = format_line2(clean_plate_text(line2)) if line2 else ""
    
    # Special case handling for line2 like '17614' which should be '176.14'
    if len(line2) == 5 and line2.isdigit():
        modified_line2 = line2[:3] + '.' + line2[3:]
        if validate_plate_format(line1, modified_line2):
            line2 = modified_line2
    
    # Validate against license plate rules
    is_valid = validate_plate_format(line1, line2)
    
    status = "certain" if is_valid else "needs_verification"
    return line1, line2, status

def clean_plate_text(text):
    """
    Initial cleaning of OCR text to remove invalid characters.
    Only keeps letters (A-Z), numbers (0-9), hyphens (-), and dots (.).
    """
    if not text:
        return ""
    
    # Keep only A-Z, 0-9, -, .
    valid_chars = ''.join(c for c in text if c.isalnum() or c in ['-', '.'])
    # Replace invalid separators with a temporary placeholder
    valid_chars = valid_chars.replace(':', '-').replace(';', '.').replace(',', '.').replace('#', '.').replace('@', '-')
    return valid_chars

def format_line1(text):
    """
    Format line 1 to match expected patterns: NN-A1, NN-AA, or NN.
    """
    if not text:
        return ""
    
    # Remove spaces and convert to uppercase
    text = text.replace(" ", "").upper()
    
    # If already contains a hyphen, keep it
    if '-' in text:
        return text
    
    # Try to infer hyphen based on length and pattern
    if len(text) == 4 and text[:2].isdigit() and text[2].isalpha() and text[3].isalnum():
        return f"{text[:2]}-{text[2:]}"  # e.g., 77A1 -> 77-A1, 77AA -> 77-AA
    if len(text) == 2 and text.isdigit():
        return text  # e.g., 77
    
    return text

def format_line2(text):
    """
    Format line 2 to match expected patterns: NNN.NN, NNNN, or NNN-AA.
    """
    if not text:
        return ""
    
    # Remove spaces and convert to uppercase
    text = text.replace(" ", "").upper()
    
    # If already contains a valid separator, keep it
    if '.' in text or '-' in text:
        return text
    
    # Try to infer separator based on length and pattern
    if len(text) == 5 and text.isdigit():
        return f"{text[:3]}.{text[3:]}"  # e.g., 12312 -> 123.12
    if len(text) == 5 and text[:3].isdigit() and text[3:].isalpha():
        return f"{text[:3]}-{text[3:]}"  # e.g., 123AA -> 123-AA
    if len(text) == 4 and text.isdigit():
        return text  # e.g., 1234
    
    return text

def validate_plate_format(line1, line2):
    """
    Validate that the license plate format follows Vietnamese rules.
    
    Line 1 patterns:
    - NN-A1 (number/number/hyphen/letter/number)
    - NN-AA (number/number/hyphen/letter/letter)
    - NN (just two numbers)
    
    Line 2 patterns:
    - NNN.NN (number/number/number/dot/number/number)
    - NNNN (four numbers)
    - NNN-AA (number/number/number/hyphen/letter/letter)
    
    Returns:
        bool: True if valid, False if invalid
    """
    import re
    
    # Line 1 validation
    line1_patterns = [
        r'^\d{2}-[A-Z]\d{1}$',  # NN-A1
        r'^\d{2}-[A-Z]{2}$',    # NN-AA
        r'^\d{2}$'              # NN
    ]
    
    # Line 2 validation
    line2_patterns = [
        r'^\d{3}\.\d{2}$',      # NNN.NN
        r'^\d{4}$',             # NNNN
        r'^\d{3}-[A-Z]{2}$'     # NNN-AA
    ]
    
    # Check if line1 matches any valid pattern
    line1_valid = any(re.match(pattern, line1) for pattern in line1_patterns)
    
    # Check if line2 matches any valid pattern
    line2_valid = any(re.match(pattern, line2) for pattern in line2_patterns)
    
    return line1_valid and line2_valid