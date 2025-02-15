from app.database.db import SessionLocal, insert_row
from app.models.violation_model import Violation
from app.config import Config
from app.models.ai_model import Model
from datetime import datetime
from loguru import logger
from tqdm import tqdm
import numpy as np
from collections import deque
from supervision.video.sink import VideoSink
from supervision.tools.detections import Detections, BoxAnnotator
from supervision.tools.line_counter import LineCounter, LineCounterAnnotator
from supervision.video.dataclasses import VideoInfo
from supervision.video.source import get_video_frames_generator
from supervision.geometry.dataclasses import Point
from supervision.draw.color import ColorPalette
from typing import List, Tuple, Dict, Any
from app.controllers.annotation import NoteAnnotator, TraceAnnotator
from app.controllers.plate_recognition import PlateRecognizer
from app.utils.utils import detect_no_helmet_violations, extract_violation_data, create_mask_bbox_violen


db_session = SessionLocal()

class AIController:
    def __init__(self, config: Config = Config):
        """Initialize AI Controller with configuration and models"""
        self.config = config
        self.model = Model()
        self.ocr_model = self.model.ocr_model
        self.vehicle_detector = self.model.detect_model
        self.plate_detector = self.model.plate_detector
        self.object_tracker = self.model.object_tracker
        self.num_frame_save = 1
        self.source_video_path = self.config.source_video_path
        
        
        self.y_min = 0
        
        
        self.CLASS_DICT = {}
        self.CLASS_ID = [0]
        self.CLASS_DICT = self.vehicle_detector.model.names
        self.data_tracker: Dict[int, List[Any]] = {}
        
        # Create instance of NoteAnnotator and NoteAnnotator
        self.note_annotator = NoteAnnotator(color_dict=self.CLASS_DICT)
        self.trace_annotator = TraceAnnotator()
        


        # Create instance of BoxAnnotator and LineCounterAnnotator
        self.box_annotator = BoxAnnotator(color=ColorPalette(), thickness=4, text_thickness=4, text_scale=1)
        self.line_annotator = LineCounterAnnotator(thickness=4, text_thickness=4, text_scale=2)
        
        self.plate_recognizer = PlateRecognizer(license_plate_detector=self.plate_detector, ocr_model=self.ocr_model)
        
        # Initialize video processing components
        self._initialize_video_components()
        
    def _initialize_video_components(self) -> None:
        """Initialize video processing components including video info, line counter, and annotators"""
        self.video_info = VideoInfo.from_video_path(self.source_video_path)
        self.generator = get_video_frames_generator(self.source_video_path)
        
        # Create LineCounter instance
        width, height = self.video_info.resolution
        LINE_START = Point(50, int(height * 0.6))
        LINE_END = Point(width - 50, int(height * 0.6))
        self.line_counter = LineCounter(start=LINE_START, end=LINE_END)
        
    def process_frame(self, frame: np.ndarray, frame_count: int) -> np.ndarray:
        """Process a single frame and return annotated frame"""
        self.note_annotator.annotate(frame)
        
        # Vehicle detection
        results = self.vehicle_detector(frame, conf=0.25, verbose = False)
        no_helmet_violations = detect_no_helmet_violations(results)
        if results[0]:
            dets = []
            for x1, y1, x2, y2, conf, id in results[0].boxes.data.cpu().numpy():
                if id in self.CLASS_ID:
                    dets.append(([int(x1), int(y1), int(x2 - x1), int(y2 - y1)], conf, id))

            if dets:
                # Object tracking
                tracks = self.object_tracker.update_tracks(dets, frame=frame)
                track_info = [(track.to_tlbr(), track.get_det_conf(), track.get_det_class(), track.track_id)
                            for track in tracks]
                track_dets, track_confs, track_classes, track_ids = zip(*track_info)
                mask = np.array([conf is not None for conf in track_confs])
                detections = None
                if len(track_dets) > 0:
                    bounding_boxes, confidences, class_ids, tracker_ids = extract_violation_data(no_helmet_violations)
                    
                    # Prepare detection data
                    xyxy = np.array(track_dets)
                    confidence = np.array(track_confs)
                    class_id = np.array(track_classes).astype(int)
                    tracker_id = np.array(track_ids).astype(object)
                    
                    # Append violation data if present
                    if bounding_boxes.size > 0:
                        xyxy = np.append(xyxy, bounding_boxes, axis=0)
                        confidence = np.append(confidence, confidences, axis=0)
                        class_id = np.append(class_id, class_ids, axis=0)
                        tracker_id = np.append(tracker_id, tracker_ids, axis=0)
                    
                    # Create violation mask
                    violen_mask_bbox = create_mask_bbox_violen(track_dets, no_helmet_violations, len(xyxy))
                    
                    # Create and configure detections
                    detections = Detections(
                        xyxy=xyxy,
                        confidence=confidence,
                        class_id=class_id,
                        tracker_id=tracker_id
                    )
                    detections.child = violen_mask_bbox
                    
                    # Apply filtering based on presence of violations
                    filter_mask = mask if not bounding_boxes.size > 0 else np.append(mask, [True]*len(bounding_boxes))
                    detections.filter(mask=filter_mask, inplace=True)
                    frame, labels = self._process_detections(frame, detections, frame_count)
                    self.line_counter.update(detections=detections)

            # Check for violations periodically
            if frame_count % self.num_frame_save == 0:
                self._check_and_record_violations(frame_count)

            # Annotate frame with bounding boxes and labels
            return self.box_annotator.annotate(frame=frame, detections=detections, labels=labels)
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
    
    def _check_and_record_violations(self, frame_count: int) -> None:
        """Check for violations and record them in the database"""
        for tracker_id in list(self.data_tracker.keys()):
            tracker_state = self.data_tracker[tracker_id]
            last_seen_frame = tracker_state[2]
            if frame_count - last_seen_frame > 5 and tracker_state[0][0] == True:
                tracker_state[0][1] = True
                plate = tracker_state[-2]
                insert_row(db_session, 
                        Violation(
                        id_detect = int(tracker_id),
                        license_plate=plate,
                        timestamp=datetime.now(),
                        image_path="/path/to/image.jpg"
                        ))
                del self.data_tracker[tracker_id]
                logger.info(f"Insert violate license_plate: {plate}")

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
            
            if xyxy[1] > self.y_min:
                if class_id == 0:
                    tracker_state[0][0] = True
                if child:
                    license_plate = child.get("license_plate")[0].get("bbox")
                    plate, ocr_conf = self.plate_recognizer.ocr_detect(frame, license_plate)
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
    