from typing import List, Tuple, Dict, Any
import numpy  as np
import cv2
import imageio.v3 as iio
import base64
import io

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
        v_xmin, v_ymin, v_xmax, v_ymax = vehicle
        v_id = id  # Assign an ID for the vehicle group

        # Find objects inside this vehicle's bounding box
        inside_objects = []
        for obj in other_objects:
            o_xmin, o_ymin, o_xmax, o_ymax, _, obj_class = obj

            # Check if the object is completely inside the vehicle bounding box
            if v_xmin <= o_xmin and v_ymin <= o_ymin and v_xmax >= o_xmax and v_ymax >= o_ymax:
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

def process_to_output_json(grouped_json, frame, post_frame):
    """
    Convert the grouped vehicle and object information into a format suitable for outputting.

    Args:
        grouped_json (list): List of dictionaries, each containing a vehicle and its associated objects.
        frame (numpy array): Original video frame.

    Returns:
        dict: JSON output with detected vehicles and violations.
    """
    output_json = {"camera_id": None, "post_frame": encode_image(post_frame),  "detected_result": []}

    for group in grouped_json:
        vehicle_id = int(group["vehicle_id"])  # Convert to int if needed
        x1, y1, x2, y2 = map(int, group["vehicle_bbox"])  # Convert to integers

        # Crop vehicle image from the frame
        vehicle_img = frame[y1:y2, x1:x2]

        # # Convert image to Base64
        # _, buffer = cv2.imencode(".jpg", vehicle_img)
        # img_base64 = base64.b64encode(buffer).decode("utf-8")

        # Check for violation (class 2: no helmet)
        if any(obj["class"] == 2 for obj in group["objects"]):
            violation = None
            plate_number = None

            for obj in group["objects"]:
                if obj["class"] == 2:
                    violation = "no_helmet"
                elif obj["class"] == 3 and "plate_number" in obj:
                    plate_number = obj["plate_number"]
                    
            output_json["detected_result"].append({
                "vehicle_id": vehicle_id,
                "image": encode_image(vehicle_img),
                "violation": violation,
                "plate_numbers": plate_number
            })

    return output_json

def encode_image(image_array: np.ndarray) -> str:
    if image_array.dtype != np.uint8:
        image_array = image_array.astype(np.uint8)
    buffer = io.BytesIO()
    iio.imwrite(buffer, image_array, format='PNG')
    image_bytes = buffer.getvalue()
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    buffer.close()
    return base64_string

def get_frames(urls: List[str]) -> List[Dict[str, Any]]:
    """Capture frames from multiple video streams using PIL."""
    data = []
    for url in urls:
        try:
            reader = iio.imiter(url)
            frame = next(reader)  # Get the first frame as numpy array
            data.append({
                "url": url,
                "frame": frame,
                "frame_count": 0
            })
        except Exception as e:
            return data
    return data