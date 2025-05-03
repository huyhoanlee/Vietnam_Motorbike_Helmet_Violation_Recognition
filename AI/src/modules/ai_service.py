import asyncio
from typing import List, Dict, Any, Optional
import numpy as np
import cv2
from loguru import logger
from src.models.schema import DeviceDetection, FrameData
from src.config import AppConfig, AppConfig_2

from src.modules.annotation import visualize_detections, visualize_yolo_results
from src.modules.vehicle_detection import VehicleDetector
from src.modules.plate_recognition import PlateRecognizer
from src.modules.object_tracking import ObjectTracker
from src.config import ModelConfig
from src.models.ai_model import Model
from src.utils import mapping_tracked_vehicles, process_to_output_json, fully_optimized_mapping_tracked_vehicles
import time
from ultralytics import YOLO
import torch
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

class AI_Service:
    def __init__(self, config: ModelConfig = ModelConfig()):
        """Initialize AI Controller with configuration and models"""
        self.config = config
        
        model = Model()
        self.vehicle_detector = YOLO(config.DETECT_WEIGHT_PATH, verbose=False)
        self.object_tracker = ObjectTracker(model.object_tracker)
        self.plate_recognizer = PlateRecognizer(ocr_model=model.ocr_model)

        self.y_min = 750.0

        self.CLASS_DICT = {}
        self.CLASS_ID = [0, 1, 2, 3]
        for id in self.CLASS_ID:
            self.CLASS_DICT[id] = self.vehicle_detector.model.names[id]
        self.data_tracker =  {}
        
    def process_frame(self, frame: np.ndarray, frame_count: int, verbose: bool = False, camera_id: str = "") -> DeviceDetection:
        """Process a single frame and return annotated frame with vehicle detections, tracking, and license plate recognition.
        
        Args:
            frame: Input frame to process
            frame_count: Current frame count
            verbose: Whether to log processing times
            camera_id: Camera identifier
            
        Returns:
            DeviceDetection object with detection results
        """
        # Start timing overall process
        total_start = time.time()
        
        # Vehicle detection
        detect_start = time.time()
        detection_results = self.vehicle_detector(frame, verbose=verbose)
        detect_time = time.time() - detect_start
        
        # Object tracking
        track_start = time.time()
        vehicle_track_dets, vehicle_track_ids = self.object_tracker.bytetrack(detection_results, frame)
        track_time = time.time() - track_start
        
        # Group objects with vehicles
        mapping_start = time.time()
        grouped_json = fully_optimized_mapping_tracked_vehicles(
            vehicle_track_dets, 
            vehicle_track_ids, 
            detection_results[0].boxes.data, 
            device  # Assuming 'device' should be a class attribute
        )
        mapping_time = time.time() - mapping_start
        
        # License plate recognition
        plate_start = time.time()
        if len(vehicle_track_dets) > 0:
            for vehicle in grouped_json:
                # Check if this is a vehicle with license plate (class 2 indicates vehicle)
                if any(obj["class"] == 2 for obj in vehicle["objects"]):
                    for obj in vehicle["objects"]:
                        # Process license plates (class 3)
                        if obj["class"] == 3:
                            x_min, y_min, x_max, y_max = map(int, obj["bbox"])
                            # Ensure coordinates are within frame boundaries
                            x_min = max(0, x_min)
                            y_min = max(0, y_min)
                            x_max = min(frame.shape[1], x_max)
                            y_max = min(frame.shape[0], y_max)
                            
                            # Skip if plate region is too small
                            if x_max <= x_min or y_max <= y_min:
                                continue
                                
                            # Crop license plate region
                            plate_frame = frame[y_min:y_max, x_min:x_max]
                            plate_frame = cv2.resize(plate_frame, (320, 320), interpolation=cv2.INTER_LANCZOS4)
                            
                            # Recognize plate
                            plate_number, plate_conf = self.plate_recognizer.recognize(plate_frame)
                            if plate_number is not None:
                                obj["plate_number"] = plate_number
                                obj["plate_conf"] = plate_conf
        plate_time = time.time() - plate_start
        
        # Visualization
        vis_start = time.time()
        post_frame = visualize_detections(frame, grouped_json)
        vis_time = time.time() - vis_start
        
        # Process to output JSON
        json_start = time.time()
        output_json = process_to_output_json(grouped_json, frame, post_frame, camera_id=camera_id)
        json_time = time.time() - json_start
        
        # Calculate total processing time
        total_time = time.time() - total_start
        
        # Log timing information if verbose is enabled
        if verbose:
            logger.info(f"Vehicle detection time: {detect_time:.3f} seconds")
            logger.info(f"Object tracking time: {track_time:.3f} seconds")
            logger.info(f"Mapping tracking time: {mapping_time:.3f} seconds")
            logger.info(f"License plate recognition time: {plate_time:.3f} seconds")
            logger.info(f"Visualization time: {vis_time:.3f} seconds")
            logger.info(f"Process to output JSON time: {json_time:.3f} seconds")
            logger.info(f"---Total time---: {total_time:.3f} seconds")
        
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
        detection_results = self.vehicle_detector(frame)
        detect_time = time.time() - detect_start

        # Object tracking
        track_start = time.time()
        # vehicle_track_dets, vehicle_track_ids = self.object_tracker.bytetrack(detection_results, frame)
        vehicle_track_dets, vehicle_track_ids = self.object_tracker.track(detection_results, frame)
        track_time = time.time() - track_start
        mapping_start = time.time()
        # Group objects with vehicles   
        # grouped_json = mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results[0].boxes.data)
        grouped_json = fully_optimized_mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results[0].boxes.data, device)
        mapping_time = time.time() - mapping_start
        # grouped_json = self.mapping_vehicles_no_tracked(detection_results[0].boxes.data)
        
        # Single OCR
        plate_time = 0
        if len(vehicle_track_dets) > 0: # Check if result has object
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

        # Batch OCR
                
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
        print(f"  Mapping tracking time: {mapping_time:.3f} seconds")
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
    
    
class AIService:
    def __init__(self, url: str = "", config: ModelConfig = ModelConfig()):
        """Initialize the AI service with vehicle detection, tracking, and plate recognition"""
        self.config = config or ModelConfig()
        self._processing_lock = asyncio.Lock()
        self._worker_semaphore = asyncio.Semaphore(AppConfig_2.MAX_CONCURRENT_AI_TASKS)
        self.url = url
        # Initialize models
        logger.info("Initializing AI models...")
        model = Model()
        # self.vehicle_detector = VehicleDetector(model.detect_model)
        self.vehicle_detector = YOLO(config.DETECT_WEIGHT_PATH, verbose=False)
        self.object_tracker = ObjectTracker(model.object_tracker)
        self.plate_recognizer = PlateRecognizer(ocr_model=model.ocr_model)

        self.y_min = 750.0

        # Setup class mapping
        self.CLASS_DICT = {}
        self.CLASS_ID = [0, 1, 2, 3]
        for id in self.CLASS_ID:
            self.CLASS_DICT[id] = self.vehicle_detector.model.names[id]
        self.data_tracker = {}
        
        logger.info("AI Service initialized successfully")
        
    async def update_config(self, new_config: Dict[str, Any]) -> None:
        """Update AI configuration parameters"""
        async with self._processing_lock:
            # Update config - this would need to be adapted to your specific configuration needs
            # For example:
            if "confidence_threshold" in new_config:
                self.config.confidence_threshold = new_config["confidence_threshold"]
            if "iou_threshold" in new_config:
                self.config.iou_threshold = new_config["iou_threshold"]
            
            logger.info(f"AI configuration updated: {new_config}")
            
    async def aprocess_frame(self, frame: np.ndarray, frame_count: int):
        """Process a single frame and return detection results - async wrapper around synchronous processing"""
        async with self._worker_semaphore:
            # Run CPU-intensive processing in a thread pool to avoid blocking the event loop
            return await asyncio.to_thread(
                self._process_frame_sync, 
                frame, 
                frame_count, 
                True,  # verbose
            )
    
    def _process_frame_sync(self, frame: np.ndarray, frame_count: int, verbose: bool = False) -> DeviceDetection:
        """Synchronous implementation of frame processing - your original code"""
        try:
            # Vehicle detection
            detect_start = time.time()
            detection_results = self.vehicle_detector.predict(frame, verbose=False)
            detect_time = time.time() - detect_start
            
            # Object tracking
            track_start = time.time()
            vehicle_track_dets, vehicle_track_ids = self.object_tracker.bytetrack(detection_results, frame)
            track_time = time.time() - track_start
            
            mapping_start = time.time()
            # Group objects with vehicles   
            grouped_json = mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results[0].boxes.data)
            mapping_time = time.time() - mapping_start
            
            # License plate recognition
            palate_start = time.time()
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
                
                # Visualization
                vis_start = time.time()
                post_frame = visualize_detections(frame, grouped_json)
                visualize_detections_time = time.time() - vis_start
                
                # Process to output JSON
                process_to_output_json_time = time.time()
                output_json = process_to_output_json(grouped_json, frame, post_frame, camera_id=self.url)
                process_to_output_json_time = time.time() - process_to_output_json_time
                
                total_time = time.time() - detect_start
                
                if verbose:
                    logger.debug(f"Detection: {detect_time:.3f}s, Tracking: {track_time:.3f}s, " 
                                f"Mapping: {mapping_time:.3f}s, Plate: {palate_time:.3f}s, "
                                f"Visualization: {visualize_detections_time:.3f}s, "
                                f"JSON Processing: {process_to_output_json_time:.3f}s, "
                                f"Total: {total_time:.3f}s")
                    logger.info(f"URL detect: {self.url}")
                
                return output_json
            else:
                # No vehicles detected
                output_json = process_to_output_json(grouped_json, frame, frame, camera_id=self.url)
                return output_json
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}", exc_info=True)
            # Return an empty result on error
            return None
    
    
    async def process_frames(self, frame_data_list: List[FrameData]) -> List[DeviceDetection]:
        """Process multiple frames concurrently"""
        if not frame_data_list:
            return []
        
        # Process frames concurrently with semaphore limiting
        tasks = []
        for frame_data in frame_data_list:
            task = asyncio.create_task(self.aprocess_frame(
                frame_data["frame"],
                frame_data["frame_count"],
            ))
            tasks.append(task)
        
        results: List[DeviceDetection] = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and replace with empty results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error processing frame {i}: {str(result)}")
                # Create empty result for failed processing
                processed_results.append(DeviceDetection(
                    camera_id=frame_data_list[i]["url"],
                    frame_count=frame_data_list[i]["frame_count"],
                    timestamp=time.time(),
                    detections=[],
                    post_frame=None
                ))
            else:
                processed_results.append(result)
        
        # Post-process results if needed
        # await self._post_process(processed_results)
        
        return processed_results