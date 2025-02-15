from typing import List, Tuple, Dict, Any
import numpy  as np

def is_inside(child_box: List[float], parent_box: List[float]) -> bool:
    """
    Check if child_box is completely inside parent_box
    Format: [x1, y1, x2, y2] (top-left and bottom-right coordinates)
    """
    c_x1, c_y1, c_x2, c_y2 = child_box
    p_x1, p_y1, p_x2, p_y2 = parent_box
    return (c_x1 >= p_x1) and (c_y1 >= p_y1) and (c_x2 <= p_x2) and (c_y2 <= p_y2)

def get_detections(results: List) -> List[Dict]:
    """Extract all detections from results"""
    detections = []
    for result in results:
        for box in result.boxes:
            detections.append({
                'class': int(box.cls),
                'bbox': box.xyxy[0].tolist(),
                'conf': box.conf.item()
            })
    return detections

def extract_violation_data(violations: List) -> Tuple[List, List, List, List]:
    bounding_boxes = []
    confidences = []
    class_ids = []
    tracker_ids = []
    
    if not violations:
        return (np.array(bounding_boxes), np.array(confidences), np.array(class_ids), np.array(tracker_ids))
    
    for violation in violations:
        for key, values in violation["child"].items():
            for value in values:
                bounding_boxes.append(value.get("bbox", []))
                confidences.append(value.get("conf", 0.0))
                class_ids.append(value.get("class", -1))
                tracker_ids.append(None)
                
    return (np.array(bounding_boxes), np.array(confidences), np.array(class_ids), np.array(tracker_ids))
def find_violations(moto_boxes: List[Dict], other_objects: List[Dict]) -> List[Dict]:
    """Find motorbikes with no helmet and their license plates"""
    results = []
    used_objects = []

    for moto in moto_boxes:
        moto_bbox = moto['bbox']
        no_helmets = []
        license_plate = []
        
        # Find all no_helmet within motorbike area
        for obj in other_objects:
            if obj['class'] == 2 and is_inside(obj['bbox'], moto_bbox) and obj not in used_objects:
                no_helmets.append(obj)
                used_objects.append(obj)
            
        if no_helmets:
            # Find license plate within motorbike area
            for obj in other_objects:
                if obj['class'] == 3 and is_inside(obj['bbox'], moto_bbox) and obj not in used_objects:
                    license_plate.append(obj)
                    used_objects.append(obj)
                    break
            moto["child"] = {"no_helmets":no_helmets, "license_plate": license_plate}
            results.append(moto)
            
    return results


def detect_no_helmet_violations(results) -> List[Dict]:
    """Main function to detect motorbikes with no helmet and their license plates"""
    # Extract all detections
    detections = get_detections(results)
    
    # Separate detections into motorbikes and other objects
    moto_boxes = [d for d in detections if d['class'] == 0]
    other_objects = [d for d in detections if d['class'] in [1, 2, 3]]
    
    # Sort motorbikes by confidence (descending)
    moto_boxes.sort(key=lambda x: x['conf'], reverse=True)
    
    # Find violations
    return find_violations(moto_boxes, other_objects)

def calculate_iou(box1: List[float], box2: List[float]) -> float:
    # Get coordinates of intersection rectangle
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    # Calculate area of intersection rectangle
    inter_area = max(0, x2 - x1) * max(0, y2 - y1)
    
    # Calculate area of both bounding boxes
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    
    # Calculate union area
    union_area = box1_area + box2_area - inter_area
    
    # Calculate IoU
    iou = inter_area / union_area if union_area > 0 else 0
    
    return iou

def create_mask_bbox_violen(track_dets, no_helmet_violations, mask_len):
    violen_mask_bbox = np.full(mask_len, None)
    for i, track_det in enumerate(track_dets):
        for no_helmet_violation in no_helmet_violations:
            iou = calculate_iou(track_det, np.array(no_helmet_violation.get("bbox")))
            if iou > 0.99:
                violen_mask_bbox[i] = no_helmet_violation.get("child")
                break
    return violen_mask_bbox