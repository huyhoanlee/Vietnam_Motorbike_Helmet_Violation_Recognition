# Application configuration initialization
from .logging_message import Message

class ModelConfig:
    DETECT_WEIGHT_PATH = "./src/models/weights/best_0428.pt"
    PADDLE_DET_PATH = "./src/models/weights/paddle/det_15_3"
    PADDLE_REC_PATH = "./src/models/weights/paddle/en_PP-OCRv3_rec_2004"
    REC_CHAR_DICT_PATH  = "./src/models/weights/paddle/en_dict.txt"
    # PADDLE_DET_PATH = "pretrained"
    # PADDLE_REC_PATH = "pretrained"
    # REC_CHAR_DICT_PATH  = "pretrained"
    PALATE_WEIGHT_PATH = "./src/models/weights/license_plate_detector.pt"
    DETECT_CONF = 0.25
    source_video_path = "MVI_0334.MOV"
    
class AppConfig:
    HOST = "http://localhost:8888"
    HOST_STREAM = "http://localhost:8888/stream/"
    # HOST = "hanaxuan-ai-service.hf.space"
    # HOST_STREAM = "https://hanaxuan-ai-service.hf.space/stream/"
    # HOST = "http://171.226.158.102:27291"
    # HOST_STREAM = "http://171.226.158.102:27291/stream/"
    PORT = 7860

class API:
    BACKEND = "https://hanaxuan-backend.hf.space"
    # BACKEND = "http://localhost:8386"
    CREATE_VIOLATION = f"{BACKEND}/api/violations/create/"
    
# src/config/__init__.py
import os
from typing import Dict, Any

class AppConfig_2:
    """Application configuration settings"""
    
    # Server settings
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    HOST_STREAM = os.getenv("HOST_STREAM", "http://localhost:8000/stream/")
    
    # Processing settings
    PROCESSING_INTERVAL = float(os.getenv("PROCESSING_INTERVAL", "0.1"))  # seconds
    HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", "60"))  # seconds
    MAX_RETRY_ATTEMPTS = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
    RETRY_COOLDOWN = float(os.getenv("RETRY_COOLDOWN", "5.0"))  # seconds
    
    # Concurrency limits
    MAX_CONCURRENT_PROCESSING = int(os.getenv("MAX_CONCURRENT_PROCESSING", "10"))
    MAX_CONCURRENT_AI_TASKS = int(os.getenv("MAX_CONCURRENT_AI_TASKS", "4"))
    
    # Frame compression
    JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "80"))
    
    # API security
    API_KEY_HEADER = "X-API-Key"
    API_KEY = os.getenv("API_KEY", "123")  # Change in production!
    
    # AI model default configuration
    AI_DEFAULT_CONFIG: Dict[str, Any] = {
        "confidence_threshold": float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.5")),
        "iou_threshold": float(os.getenv("AI_IOU_THRESHOLD", "0.45")),
        "max_detections": int(os.getenv("AI_MAX_DETECTIONS", "100")),
        # Add other AI config parameters as needed
    }