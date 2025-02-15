from pathlib import Path
from typing import List, Union

import numpy as np
import torch
from deep_sort_realtime.deepsort_tracker import DeepSort
from ultralytics import YOLO
from paddleocr import PaddleOCR
from app.config import Config
from loguru import logger
# Load a model
class Model:
    def __init__(self, config: Config = Config):
        # Check if CUDA is available
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
            use_gpu = True
        else:
            self.device = torch.device("cpu")
            use_gpu = False
            
        self.config = config
        self.detect_model = YOLO(config.DETECT_WEIGHT_PATH, verbose=False)
        self.plate_detector = YOLO(config.PALATE_WEIGHT_PATH, verbose=False)
        self.ocr_model = PaddleOCR(lang='en', show_log=False, use_angle_cls=True, use_gpu=use_gpu)
        self.object_tracker = DeepSort(max_age=20,
                                n_init=2,
                                nms_max_overlap=1.0,
                                max_cosine_distance=0.3,
                                nn_budget=None,
                                override_track_class=None,
                                embedder="mobilenet",
                                half=True,
                                bgr=True,
                                embedder_gpu=use_gpu,
                                embedder_model_name=None,
                                embedder_wts=None,
                                polygon=False,
                                today=None)
        # self.init()
        
    def init(self):
        logger.info("model initiation....")
        img = np.zeros((640, 480, 3), dtype=np.uint8)
        self.detect_model(img, verbose=False, half=True)
        self.ocr_model.ocr(img, cls=True)
        logger.info("model init successful")