import numpy as np
import torch
from src.config import ModelConfig
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from paddleocr import PaddleOCR
from loguru import logger

# Load a model
class Model:
    def __init__(self, config: ModelConfig = ModelConfig()):
        # Check if CUDA is available
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
            use_gpu = True
        else:
            self.device = torch.device("cpu")
            use_gpu = False
            
        self.config = config
        self.detect_model = YOLO(config.DETECT_WEIGHT_PATH, verbose=False)
        self.ocr_model = PaddleOCR(lang='en', show_log=False, use_angle_cls=True, use_gpu=use_gpu)
        self.object_tracker = DeepSort(
                            max_age=1,  
                            n_init=2,  
                            nms_max_overlap=1.0,  # Avoid redundant overlap checks
                            max_cosine_distance=0.2,  # Faster similarity checks
                            nn_budget=50,  # Limit embedding storage
                            embedder="mobilenet",
                            embedder_model_name="mobilenetv2_x1_0",  # Smaller & faster version
                            embedder_gpu=True,  
                            half=True,  # Use FP16 for speed
                            )
        self.warmup()
        
    def warmup(self):
        logger.info("model initiation....")
        img = np.zeros((640, 480, 3), dtype=np.uint8)
        self.detect_model(img, verbose=False, half=True)
        self.ocr_model.ocr(img, cls=True)
        logger.info("model warmup successful")