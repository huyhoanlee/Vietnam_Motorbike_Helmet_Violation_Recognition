# Application configuration initialization

class Config:
    PALATE_WEIGHT_PATH = "./demo/data/models/license_plate_detector.pt"
    DETECT_WEIGHT_PATH = "./demo/data/models/yolov8s.pt"
    DETECT_CONF = 0.25
    # source_video_path = "./demo/image.png"
    source_video_path = "./demo/data/vehicle-counting.mp4"