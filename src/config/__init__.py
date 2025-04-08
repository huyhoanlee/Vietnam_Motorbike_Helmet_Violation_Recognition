# Application configuration initialization
from .logging_message import Message

class ModelConfig:
    DETECT_WEIGHT_PATH = "./src/models/weights/best.pt"
    PALATE_WEIGHT_PATH = "./src/models/weights/license_plate_detector.pt"
    DETECT_CONF = 0.25
    source_video_path = "MVI_0334.MOV"
    
class AppConfig:
    HOST = "hanaxuan-ai-service.hf.space"
    HOST_STREAM = "https://hanaxuan-ai-service.hf.space/stream/"
    PORT = 7860

class API:
    BACKEND = "https://hanaxuan-backend.hf.space"
    CREATE_VIOLATION = f"{BACKEND}/api/violations/create/"