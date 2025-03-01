from loguru import logger
from tqdm import tqdm
import numpy as np
from collections import deque
from supervision.video.sink import VideoSink
from supervision.tools.detections import Detections, BoxAnnotator

from supervision.draw.color import ColorPalette
from typing import List, Tuple, Dict, Any
from src.modules.annotation import NoteAnnotator, TraceAnnotator, visualize_detections
from src.modules.vehicle_detection import VehicleDetector
from src.modules.plate_recognition import PlateRecognizer
from src.modules.object_tracking import ObjectTracker
from src.config import ModelConfig
from src.models.ai_model import Model
from src.utils import mapping_tracked_vehicles, process_to_output_json

class AI_Service:
    def __init__(self, config: ModelConfig = ModelConfig):
        """Initialize AI Controller with configuration and models"""
        self.config = config
        
        self.vehicle_detector = VehicleDetector()
        self.object_tracker = ObjectTracker()
        self.model = Model()
        self.ocr_model = self.model.ocr_model
        self.plate_recognizer = PlateRecognizer(ocr_model=self.ocr_model)
        
        self.y_min = 750.0
        
        # print(dir(self.vehicle_detector))

        self.CLASS_DICT = {}
        self.CLASS_ID = [0, 1, 2, 3]
        for id in self.CLASS_ID:
            self.CLASS_DICT[id] = self.vehicle_detector.model.names[id]
        self.data_tracker =  {}
        
        # Create instance of NoteAnnotator and NoteAnnotator
        # self.note_annotator = NoteAnnotator(color_dict=self.CLASS_DICT)
        # self.trace_annotator = TraceAnnotator() #draw trace

        # Create instance of BoxAnnotator and LineCounterAnnotator
        # self.box_annotator = BoxAnnotator(color=ColorPalette(), thickness=4, text_thickness=4, text_scale=1)
        # self.line_annotator = LineCounterAnnotator(thickness=4, text_thickness=4, text_scale=2)
        

        # Initialize video processing components
        # self._initialize_video_components()
        
    def process_frame(self, frame: np.ndarray, frame_count: int) -> np.ndarray:
        """Process a single frame and return annotated frame"""
        # self.note_annotator.annotate(frame)
        
        # Vehicle detection
        detection_results = self.vehicle_detector.detect(frame)
        # print("Vehicle detection", detection_results[0].boxes)
        # Object tracking
        vehicle_track_dets, track_confs, track_classes, vehicle_track_ids, mask = self.object_tracker.track(detection_results, frame)
        # print(vehicle_track_dets ,track_classes, vehicle_track_ids, mask)
        grouped_json = mapping_tracked_vehicles(vehicle_track_dets, vehicle_track_ids, detection_results[0].boxes.data)
        # print(grouped_json)
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
                
            # print(grouped_json)
            # frame, labels = self._process_detections(frame, detections, frame_count)
            # self.line_counter.update(detections=detections)
            post_frame = visualize_detections(frame, grouped_json)
            output_json = process_to_output_json(grouped_json, frame, post_frame)
            
            # Annotate frame with bounding boxes and labels
            # return self.box_annotator.annotate(frame=frame, detections=detections, labels=labels)
            return output_json
        else:
            return frame
        
    def process_video(self, output_path: str, start_frame: int = 0) -> None:
        """
        Process video file starting from a specific frame and save output.

        Parameters:
        - output_path (str): Path to save the processed video.
        - start_frame (int): Frame index to start processing from (default is 0).
        """
        with VideoSink(output_path, self.video_info) as sink:
            frame_count = 0
            for frame in tqdm(self.generator, total=self.video_info.total_frames):
                # Bỏ qua các frame trước start_frame
                if frame_count < start_frame:
                    frame_count += 1
                    continue

                # Xử lý các frame từ start_frame trở đi
                processed_frame = self.process_frame(frame, frame_count)
                sink.write_frame(processed_frame)
                frame_count += 1

    def process_stream(self, stream_url: str, output_path: str = None) -> None:
        """Process live video stream"""
        import cv2
        
        cap = cv2.VideoCapture(stream_url)
        frame_count = 0
        
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, 30.0, 
                                (int(cap.get(3)), int(cap.get(4))))
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            processed_frame = self.process_frame(frame, frame_count)
            
            if output_path:
                out.write(processed_frame)
            
            frame_count += 1
            
            # Display processed frame
            cv2.imshow('Processed Stream', processed_frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        if output_path:
            out.release()
        cv2.destroyAllWindows()

    # ... (keep existing helper methods _process_detections, _check_and_record_violations, inference_ocr)

    def _process_detections(self, frame: np.ndarray, detections: Detections, frame_count: int) -> Tuple[np.ndarray, List[str]]:
        """Process detections and update tracking information"""
        labels = []
        for i, detect in enumerate(detections):
            xyxy, confidence, class_id, tracker_id = detect
            if tracker_id is None:
                continue
            if tracker_id not in self.data_tracker:
                self.data_tracker[tracker_id] = [[False,False], 0, frame_count, deque(maxlen=64), None, 0]
                # [ ??, number_tracking, frame_count, deque, bbox_frame, ocr_conf]
            child = detections.child[i]
            
            x1, y1, x2, y2 = [int(i) for i in xyxy]
            center_point = (int((x2 + x1) / 2), int((y1 + y2) / 2))
            self.data_tracker[tracker_id][3].appendleft(center_point)

            tracker_state = self.data_tracker[tracker_id]
            print("sdfasd", tracker_state)
            if xyxy[1] > self.y_min:
                if class_id == 0:
                    tracker_state[0][0] = True
                if child:
                    license_plate = child.get("license_plate")[0].get("bbox")
                    plate, ocr_conf = self.plate_recognizer.recognize(frame, license_plate)
                    if plate is not None and ocr_conf > tracker_state[-1]:
                        tracker_state[-2], tracker_state[-1] = plate, ocr_conf
                tracker_state[1] += 1
                tracker_state[2] = frame_count

                if tracker_state[-2] is not None:
                    text = f"[{tracker_state[-2]}] Conf: {tracker_state[-1]:0.2f}"
                    frame = self.plate_recognizer.annotate(frame, xyxy, text)

            labels.append(
                f"[{tracker_id}] {self.CLASS_DICT[class_id].capitalize()} "
                f"| Conf: {confidence:0.2f}")

            self.trace_annotator.annotate(frame, tracker_state[3], class_id)

        return frame, labels
    