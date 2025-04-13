from collections import deque
from typing import Union

import cv2
import numpy as np
from supervision.draw.color import Color
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


class NoteAnnotator:
    """
    A class for annotating an image with colored boxes and labels.

    Args:
        color_dict (dict): A dictionary mapping color IDs to color names.
        color (Union[Color, ColorPalette], optional): The color palette to use. Defaults to ColorPalette().
        font (int, optional): The font type to use. Defaults to cv2.FONT_HERSHEY_TRIPLEX.
        text_scale (float, optional): The scale of the text. Defaults to 2.
        text_thickness (int, optional): The thickness of the text. Defaults to 5.
    """

    def __init__(
            self,
            color_dict: dict,
            color: Union[Color, ColorPalette] = ColorPalette(),
            font=cv2.FONT_HERSHEY_TRIPLEX,
            text_scale=2,
            text_thickness=5):

        self.color_dict = color_dict
        self.color = color
        self.font = font
        self.text_scale = text_scale
        self.text_thickness = text_thickness

    def annotate(self, frame):
        """
        Draw colored boxes and labels on the image (frame) based on the color dictionary.

        Args:
            frame (numpy.ndarray): The input image (frame) to annotate.

        Returns:
            numpy.ndarray: The annotated image (frame).
        """
        padding = int(frame.shape[0] / 72)
        box_size = padding * 4

        x1, y1 = padding, padding
        x2 = box_size + padding * 3 + int(padding * 4 / 3) * find_longest_value(self.color_dict)
        y2 = len(self.color_dict) * (padding + box_size) + padding * 2

        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 255), cv2.FILLED)

        x1_box = x1 + padding
        x2_box = x1 + padding + box_size
        y1_box = y1 + padding
        y2_box = y1 + padding + box_size

        x_text = x1 + padding * 2 + box_size

        # Iterate through the color dictionary and draw square boxes
        for i, key in enumerate(self.color_dict):
            if i != 0:
                y1_box += (padding + box_size)
                y2_box += (padding + box_size)
            
            print(key)
            color = self.color.by_idx(key)
            print(color)
            cv2.rectangle(frame, (x1_box, y1_box), (x2_box, y2_box), color.as_bgr(), cv2.FILLED)

            y_text = y2_box - padding

            cv2.putText(
                img=frame,
                text=self.color_dict[key].capitalize(),
                org=(x_text, y_text),
                fontFace=self.font,
                fontScale=self.text_scale,
                color=(0, 0, 0),
                thickness=self.text_thickness,
                lineType=cv2.LINE_AA,
            )
        
        return frame


class TraceAnnotator:
    """
    A class for annotating a frame with a tracking trail.

    Args:
        color (Union[Color, ColorPalette], optional): Color or ColorPalette for annotation.
            Defaults to ColorPalette.default().
        text_scale (float, optional): The scale of the annotated text. Defaults to 1.5.
        text_thickness (int, optional): The thickness of the annotated text. Defaults to 5.
        text_padding (int, optional): The padding around the annotated text. Defaults to 10.
    """

    def __init__(
            self,
            color: Union[Color, ColorPalette] = ColorPalette(),
            text_scale: float = 1.5,
            text_thickness: int = 5,
            text_padding: int = 10
    ):
        self.color = color
        self.text_scale = text_scale
        self.text_thickness = text_thickness
        self.text_padding = text_padding

    def annotate(
            self,
            frame,
            data_deque: deque,
            cls: int
    ) -> None:
        """
        Annotate the frame with a tracking trail.

        Args:
            frame: The input image frame to annotate.
            data_deque (deque): A deque containing tracking data points.
            cls: The class index for selecting a color for the tracking trail.
        """
        # Define color of the tracking trail
        color = self.color.by_idx(cls)

        for i in range(1, len(data_deque)):
            # Check if one of the buffer values is None
            if data_deque[i - 1] is None or data_deque[i] is None:
                continue

            # Generate dynamic thickness of trails
            thickness = int(np.sqrt(64 / float(i + i)) * 4)

            # Draw trails
            cv2.line(frame, data_deque[i - 1], data_deque[i], color.as_bgr(), thickness)

def visualize_detections(frame, detections):
    """
    Draws bounding boxes on the frame based on detected objects.

    Args:
        frame (np.ndarray): Image frame.
        detections (list): List of dictionaries containing vehicle data.

    Returns:
        np.ndarray: Annotated frame.
    """
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
            else:
                label = f"Class {obj_class} ({conf:.2f})"

            # If license plate, display plate number
            if obj_class == 3 and "plate_number" in obj:
                label = f"Plate: {obj['plate_number']} ({obj['plate_conf']:.2f})"
            
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, colors[obj_class], 2)

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