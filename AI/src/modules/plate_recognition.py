from typing import Union
import cv2
import numpy as np
from supervision.draw.color import Color, ColorPalette
from ultralytics import YOLO
from paddleocr import PaddleOCR


class PlateRecognizer:
    """
    A class for license plate recognition.

    Args:
        license_plate_detector: A license plate detection model.
        ocr_model: An Optical Character Recognition (OCR) model.
        plate_conf (float, optional): Confidence threshold for license plate detection.
            Defaults to 0.6.
        color (Union[Color, ColorPalette], optional): Color or ColorPalette for annotation.
            Defaults to ColorPalette.default().
        text_scale (float, optional): The scale of the annotated text. Defaults to 1.5.
        text_thickness (int, optional): The thickness of the annotated text. Defaults to 5.
        text_padding (int, optional): The padding around the annotated text. Defaults to 10.
    """

    def __init__(
            self,
            ocr_model,
    ):
        # self.license_plate_detector = license_plate_detector
        self.ocr_model = ocr_model
    def recognize(
            self,
            plate_frame: np.ndarray

    ) -> Union[tuple[None, None], tuple[str, float]]:
        """
        Detect a license plate in a given frame.

        Args:
            frame(np.ndarray): The input image frame to detect.

        Returns:
            Union[None, tuple[str, float]]: A tuple containing the recognized plate text and confidence score,
            or None if no plate is detected.
        """
        result = self.ocr_model.ocr(plate_frame, cls=True)
        if result and result[0]:
            plate_text = []
            confidences = []
            for line in result[0]:  # line: [bbox, (text, confidence)]
                if len(line) >= 2 and isinstance(line[-1], tuple):
                    text, conf = line[-1]
                    plate_text.append(text)
                    confidences.append(conf)
            plate_text = "\n".join(plate_text)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0
            return plate_text, avg_conf
    
        return None, None

# Example usage
if __name__ == "__main__":
    ocr_model = PaddleOCR(lang='en', show_log=False, use_angle_cls=True, use_gpu=True)
    plate_recognizer = PlateRecognizer(ocr_model=ocr_model)
    image = cv2.imread("CAM026_20250224_1930_Mua_12 copy 2.jpg")
    ocr_result = plate_recognizer.recognize(image)
    print("OCR: ", ocr_result)