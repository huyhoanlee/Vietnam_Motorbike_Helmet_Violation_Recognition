from loguru import logger
import numpy as np
import time

from src.modules.annotation import visualize_detections, visualize_yolo_results
from src.modules.vehicle_detection import VehicleDetector
from src.modules.plate_recognition import PlateRecognizer
from src.modules.object_tracking import ObjectTracker
from src.config import ModelConfig
from src.models.ai_model import Model
from src.utils import mapping_tracked_vehicles, process_to_output_json
from src.models.base_model import DeviceDetection
import time, cv2

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
        
    def process_frame(self, frame: np.ndarray, frame_count: int, verbose: bool = False, camera_id: str="CAM38") -> DeviceDetection:
        """Process a single frame and return annotated frame"""
        # Vehicle detection
        
        detect_start = time.time()
        detection_results = self.vehicle_detector.detect(frame)
        detect_time = time.time() - detect_start
        
        # Object tracking
        track_start = time.time()
        vehicle_track_dets, track_confs, track_classes, vehicle_track_ids, mask = self.object_tracker.track(detection_results, frame)
        track_time = time.time() - track_start
        
        mapping_start = time.time()
        # Group objects with vehicles   
        grouped_json = mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results[0].boxes.data)
        mapping_time = time.time() - mapping_start
        
        
        palate_start = time.time()
        # License plate recognition 
        if len(vehicle_track_dets) > 0:
            for vehicle in grouped_json:
                if any(obj["class"] == 2 for obj in vehicle["objects"]):
                    for obj in vehicle["objects"]:
                        if obj["class"] == 3:
                            x_min, y_min, x_max, y_max = map(int, obj["bbox"])
                            plate_frame = frame[y_min:y_max, x_min:x_max]  # Crop license plate region
                            plate_frame = cv2.resize(plate_frame, (320, 320), interpolation=cv2.INTER_LANCZOS4)
                            plate_number, plate_conf = self.plate_recognizer.recognize(plate_frame)
                            if plate_number is not None:
                                obj["plate_number"] = plate_number
                                obj["plate_conf"] = plate_conf
            
            palate_time = time.time() - palate_start
            
            vis_start = time.time()
            # Visualization
            # post_frame = visualize_detections(frame, grouped_json)
            post_frame = frame
            visualize_detections_time = time.time() - vis_start
            
            process_to_output_json_time = time.time()
            # Process to output JSON
            output_json = process_to_output_json(grouped_json, frame, post_frame, camera_id=camera_id)
            process_to_output_json_time = time.time() - process_to_output_json_time
            total_time = time.time() - detect_start
            if verbose:
                logger.info(f"Vehicle detection time: {detect_time:.3f} seconds")
                logger.info(f"Object tracking time: {track_time:.3f} seconds")
                logger.info(f"Mapping tracking time: {mapping_time:.3f} seconds")
                logger.info(f"License plate recognition time: {palate_time:.3f} seconds")
                logger.info(f"Visualization time: {visualize_detections_time:.3f} seconds") 
                logger.info(f"Process to output JSON time: {process_to_output_json_time:.3f} seconds")  
                logger.info(f"---Total time---: {total_time:.3f} seconds")  
                return output_json, detect_time, track_time, palate_time, visualize_detections_time, process_to_output_json_time
            return output_json
        else:
            output_json = process_to_output_json(grouped_json, frame, frame)
            if verbose:
                logger.info(f"Vehicle detection time: {detect_time:.3f} seconds")
                logger.info(f"Object tracking time: {track_time:.3f} seconds")
                logger.info(f"Mapping tracking time: {mapping_time:.3f} seconds")
                logger.info(f"License plate recognition time: {palate_time:.3f} seconds")
                logger.info(f"Visualization time: {visualize_detections_time:.3f} seconds") 
                logger.info(f"Process to output JSON time: {process_to_output_json_time:.3f} seconds")
                logger.info(f"---Total time---: {total_time:.3f} seconds")  
                return output_json, detect_time, track_time, palate_time, visualize_detections_time, process_to_output_json_time
            return output_json
    

    def mapping_vehicles_no_tracked(self, detection_results, device="cuda:0"):
        """
        Group objects of class 1 (helmet), 2 (no-helmet), 3 (license plate) with class 0 (vehicle)
        if they are inside the vehicle bounding box.

        Args:
            detections (torch.Tensor): Tensor of shape (N, 6) with [x_min, y_min, x_max, y_max, conf, class_id]
            device (str): Device to run the computation on (default: "cuda:0")

        Returns:
            list: List of dictionaries, each containing a vehicle and its associated objects.
        """
        vehicles = detection_results[detection_results[:, 5] == 0]  # Get all vehicles (class 0)
        other_objects = detection_results[detection_results[:, 5] != 0]  # Get non-vehicle objects

        grouped = []
        
        for id, vehicle_coordinate in enumerate(vehicles):
            v_xmin, v_ymin, v_xmax, v_ymax, _, _ = vehicle_coordinate
            v_id = id  # Assign an ID for the vehicle group

            # Find objects inside this vehicle's bounding box
            inside_objects = []
            for obj in other_objects:
                o_xmin, o_ymin, o_xmax, o_ymax, _, obj_class = obj

                # Check if the object is completely inside the vehicle bounding box
                if v_xmin <= o_xmin and v_ymin <= o_ymin and v_xmax >= o_xmax and v_ymax >= o_ymax:
                    inside_objects.append({
                        "class": int(obj_class.item()),
                        "bbox": obj[:4].tolist(),  # Convert to list for easier usage
                        "confidence": float(obj[4].item())
                    })

            grouped.append({
                "vehicle_id": v_id,
                "vehicle_bbox": vehicle_coordinate[:4].tolist(),
                # "confidence": float(vehicle[4].item()),
                "objects": inside_objects
            })

        return grouped
    def test_process_frame(self, frame: np.ndarray, frame_count: int) -> DeviceDetection:
        """Process a single frame and return DRAWED FRAME"""
        # Start total time
        total_start = time.time()

        # Vehicle detection
        detect_start = time.time()
        detection_results = self.vehicle_detector.detect(frame)
        detect_time = time.time() - detect_start

        # Object tracking
        track_start = time.time()
        vehicle_track_dets, track_confs, track_classes, vehicle_track_ids, mask = self.object_tracker.track(detection_results, frame)
        track_time = time.time() - track_start
        grouped_json = mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results[0].boxes.data)
        # grouped_json = self.mapping_vehicles_no_tracked(detection_results[0].boxes.data)
        
        # OCR
        plate_time = 0
        if len(vehicle_track_dets) > 0:
            plate_start = time.time()
            for vehicle in grouped_json:
                if any(obj["class"] == 2 for obj in vehicle["objects"]):
                    for obj in vehicle["objects"]:
                        if obj["class"] == 3:
                            x_min, y_min, x_max, y_max = map(int, obj["bbox"])
                            plate_frame = frame[y_min:y_max, x_min:x_max]  # Crop license plate region
                            plate_frame = cv2.resize(plate_frame, (320, 320), interpolation=cv2.INTER_LANCZOS4)
                            plate_number, plate_conf = self.plate_recognizer.recognize(plate_frame)
                            if plate_number is not None:
                                obj["plate_number"] = plate_number
                                obj["plate_conf"] = plate_conf
            plate_time = time.time() - plate_start
                
        # Visualization
        vis_start = time.time()
        post_frame = visualize_detections(frame, grouped_json)
        vis_time = time.time() - vis_start

        # Total time
        total_time = time.time() - total_start
        # Print timing results
        print(f"Frame {frame_count} processing times:")
        print(f"  Vehicle Detection: {detect_time:.3f} seconds")
        print(f"  Object Tracking: {track_time:.3f} seconds")
        print(f"  License Plate Recognition: {plate_time:.3f} seconds")
        print(f"  Visualization: {vis_time:.3f} seconds")
        print(f"  Total Time: {total_time:.3f} seconds")

        return post_frame

    def streaming_visualize(self, frame: bytes) -> bytes:
        # Decode JPEG bytes to OpenCV image (NumPy array)
        frame_array = cv2.imdecode(np.frombuffer(frame, np.uint8), cv2.IMREAD_COLOR)
        if frame_array is None:
            print("Error: Could not decode frame")
            return b""  # Return empty bytes on failure
        
        # Perform vehicle detection
        detection_results = self.vehicle_detector.detect(frame_array)
        
        # Visualize detection results on the decoded frame
        frame_with_boxes = visualize_yolo_results(frame_array, detection_results)
        
        # Encode the visualized frame back to JPEG bytes
        success, encoded_image = cv2.imencode(".jpg", frame_with_boxes)
        if not success:
            print("Error: Could not encode frame")
            return b""  # Return empty bytes on failure
        
        # Convert to bytes and return
        frame_bytes = encoded_image.tobytes()
        return frame_bytes