from ultralytics import YOLO
import torch
import numpy as np
import cv2
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from src.config import ModelConfig

class VehicleDetector:
    def __init__(self, config = ModelConfig):
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
            use_gpu = True
        else:
            self.device = torch.device("cpu")
            use_gpu = False
        
        self.model = YOLO(config.DETECT_WEIGHT_PATH, verbose=False)

    
    def detect(self, origin_frame):
        # Vehicle detection
        results = self.model(origin_frame, conf=0.25, verbose = False)
        return results
    
# Usage
if __name__ == "__main__":
    model = VehicleDetector()
    image = cv2.imread("test.jpg")
    results = model.detect(image)
    print(results)