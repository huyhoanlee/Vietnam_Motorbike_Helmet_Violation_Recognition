import numpy as np
from src.config import ModelConfig
from deep_sort_realtime.deepsort_tracker import DeepSort
from loguru import logger
import torch
from ultralytics import YOLO
from paddleocr import PaddleOCR
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
            
        print(f"Using device: {self.device}")
        self.config = config
        self.detect_model = YOLO(config.DETECT_WEIGHT_PATH, verbose=False)
        if config.PADDLE_DET_PATH == "pretrained" and config.PADDLE_REC_PATH == "pretrained":
            self.ocr_model = PaddleOCR(lang='en', show_log=False, use_angle_cls=True, use_gpu=use_gpu)
        else:
            self.ocr_model = PaddleOCR(det_model_dir=config.PADDLE_DET_PATH, rec_model_dir=config.PADDLE_REC_PATH, rec_char_dict_path=config.REC_CHAR_DICT_PATH, show_log=False, use_angle_cls=True, use_gpu=True)
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