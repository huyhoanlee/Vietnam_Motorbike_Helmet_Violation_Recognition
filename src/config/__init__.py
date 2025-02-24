# Application configuration initialization

class Config:
    PALATE_WEIGHT_PATH = "./src/models/weights/license_plate_detector.pt"
    DETECT_WEIGHT_PATH = "./src/models/weights/best.pt"
    DETECT_CONF = 0.25
    # source_video_path = "./demo/image.png"
    source_video_path = "MVI_0334.MOV"