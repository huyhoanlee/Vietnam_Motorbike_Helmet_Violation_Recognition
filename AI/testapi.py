from src.config import ModelConfig
from src.models.ai_model import Model
from ultralytics import YOLO
config = ModelConfig()
vehicle_detector = YOLO(config.DETECT_WEIGHT_PATH)
model = Model()