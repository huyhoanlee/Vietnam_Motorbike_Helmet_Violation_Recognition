from loguru import logger
import numpy as np

from src.modules.annotation import visualize_detections
from src.modules.vehicle_detection import VehicleDetector
from src.modules.plate_recognition import PlateRecognizer
from src.modules.object_tracking import ObjectTracker
from src.config import ModelConfig
from src.models.ai_model import Model
from src.utils import mapping_tracked_vehicles, process_to_output_json
from src.models.base_model import DeviceDetection

class AI_Service:
    def __init__(self, config: ModelConfig = ModelConfig()):
        """Initialize AI Controller with configuration and models"""
        self.config = config
        
        model = Model()
        self.vehicle_detector = VehicleDetector(model.detect_model)
        self.object_tracker = ObjectTracker(model.object_tracker)
        self.plate_recognizer = PlateRecognizer(ocr_model=model.ocr_model)

        self.y_min = 750.0

        self.CLASS_DICT = {}
        self.CLASS_ID = [0, 1, 2, 3]
        for id in self.CLASS_ID:
            self.CLASS_DICT[id] = self.vehicle_detector.model.names[id]
        self.data_tracker =  {}
        
    def process_frame(self, frame: np.ndarray, frame_count: int) -> DeviceDetection:
        """Process a single frame and return annotated frame"""
        # Vehicle detection
        detection_results = self.vehicle_detector.detect(frame)

        # Object tracking
        vehicle_track_dets, track_confs, track_classes, vehicle_track_ids, mask = self.object_tracker.track(detection_results, frame)
        grouped_json = mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results[0].boxes.data)
        if len(vehicle_track_dets) > 0:
            for vehicle in grouped_json:
                if any(obj["class"] == 2 for obj in vehicle["objects"]):
                    for obj in vehicle["objects"]:
                        if obj["class"] == 3:
                            x_min, y_min, x_max, y_max = map(int, obj["bbox"])
                            plate_frame = frame[y_min:y_max, x_min:x_max]  # Crop license plate region
                            plate_number, plate_conf = self.plate_recognizer.recognize(plate_frame)
                            if plate_number is not None:
                                obj["plate_number"] = plate_number
                                obj["plate_conf"] = plate_conf
                
            post_frame = visualize_detections(frame, grouped_json)
            output_json = process_to_output_json(grouped_json, frame, post_frame)
            
            return output_json
        else:
            return process_to_output_json(grouped_json, frame, frame)