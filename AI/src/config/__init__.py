# Application configuration initialization
from .logging_message import Message

class ModelConfig:
    DETECT_WEIGHT_PATH = "./src/models/weights/detector.pt"
    PADDLE_DET_PATH = "./src/models/weights/paddle/det_15_3"
    PADDLE_REC_PATH = "./src/models/weights/paddle/rec_inference"
    REC_CHAR_DICT_PATH  = "./src/models/weights/paddle/en_dict.txt"
    # PADDLE_DET_PATH = "pretrained"
    # PADDLE_REC_PATH = "pretrained"
    # REC_CHAR_DICT_PATH  = "pretrained"
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