from collections import deque
from typing import Union
import cv2
import numpy as np
from supervision.draw.color import ColorPalette


def find_longest_value(color_dict):
    """
    Find the length of the longest color name in the color dictionary.

    Args:
        color_dict (dict): A dictionary mapping color IDs to color names.

    Returns:
        int: The length of the longest color name.
    """
    return max(len(name) for name in color_dict.values())


def visualize_detections(frame_ori, detections):
    """
    Draws bounding boxes on the frame based on detected objects.

    Args:
        frame (np.ndarray): Image frame.
        detections (list): List of dictionaries containing vehicle data.

    Returns:
        np.ndarray: Annotated frame.
    """
    # frame = frame_ori.copy()  # Create a copy of the frame to avoid modifying the original
    frame = frame_ori  # Create a copy of the frame to avoid modifying the original
    # Define colors for each class
    colors = {0: (0, 255, 0),  # Green - Vehicle
              1: (255, 0, 0),  # Blue - Helmet
              2: (0, 0, 255),  # Red - No Helmet
              3: (0, 255, 255)}  # Yellow - License Plate

    for vehicle in detections:
        # Draw vehicle bounding box
        vehicle_bbox = vehicle["vehicle_bbox"]
        x_min, y_min, x_max, y_max = map(int, vehicle_bbox)
        cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), colors[0], 1)
        cv2.putText(frame, f"Moto {vehicle['vehicle_id']}", 
                    (x_min, y_min - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, colors[0], 2)

        # Draw each associated object
        for obj in vehicle["objects"]:
            obj_class = obj["class"]
            obj_bbox = obj["bbox"]
            x1, y1, x2, y2 = map(int, obj_bbox)
            conf = obj["confidence"]

            # Draw object bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), colors[obj_class], 1)
            if obj_class == 2:
                label = f"No Helmet ({conf:.2f})"
                cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, colors[obj_class], 2)

            elif obj_class == 3 and "plate_number" in obj:  # If license plate, display plate number
                dump_plate = obj["plate_number"].replace("\n", " ")
                label = f"{dump_plate} ({obj['plate_conf']:.2f})"
                cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, colors[obj_class], 2)
            # else:
            #     label = f"Class {obj_class} ({conf:.2f})"

    return frame


names = {
    0: 'moto',
    1: 'helm',
    2: 'NO HELM',
    3: 'plate'
}
colors = {
    0: (0, 255, 0),   # Green - Moto
    1: (255, 0, 0),   # Blue - Helmet
    2: (0, 0, 255),   # Red - No Helmet
    3: (0, 255, 255)  # Yellow - License Plate
}

def visualize_yolo_results(img, res):
    # Sao chép ảnh gốc để tránh thay đổi
    img_vis = img.copy()
    
    # Lấy kết quả từ res (giả sử res là kết quả từ detect_model.predict)
    for result in res:
        boxes = result.boxes  # Lấy danh sách các bounding box
        
        for box in boxes:
            # Lấy tọa độ bounding box
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            # Lấy class id và confidence
            cls_id = int(box.cls)
            conf = float(box.conf)
            
            # Lấy tên class và màu sắc tương ứng
            class_name = names[cls_id]
            color = colors[cls_id]
            
            # Vẽ bounding box
            cv2.rectangle(img_vis, (x1, y1), (x2, y2), color, 2)
            
            label = f'{class_name} {conf:.1f}'
            (label_width, label_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 2
            )
            
            cv2.rectangle(
                img_vis, 
                (x1, y1 - label_height - baseline), 
                (x1 + label_width, y1), 
                color, 
                cv2.FILLED
            )
            
            cv2.putText(
                img_vis, 
                label, 
                (x1, y1 - baseline), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.4, 
                (0, 0, 0),  # Màu chữ đen
                2
            )
    
    return img_vis