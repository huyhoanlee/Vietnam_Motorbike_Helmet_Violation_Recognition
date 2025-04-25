from deep_sort_realtime.deepsort_tracker import DeepSort
import numpy as np
import cv2
from src.modules.vehicle_detection import VehicleDetector
import supervision as sv
from supervision import Detections

class ObjectTracker:
    def __init__(self, model):
        self.tracked_objects = []
        self.object_tracker = model
        self.bytetracker = sv.ByteTrack(
                        track_activation_threshold= 0.25,
                        lost_track_buffer= 30,
                        minimum_matching_threshold = 0.8,
                        frame_rate= 30,
                        minimum_consecutive_frames= 1,
                            )
        self.TRACKING_CLASS = [0]
    
    def track(self, detection_results, origin_frame):
        track_dets = tuple()
        track_confs = tuple()
        track_classes = tuple()
        track_ids = tuple()
        mask = np.array([])
        if detection_results[0]:
            dets = []
            for x1, y1, x2, y2, conf, id in detection_results[0].boxes.data.cpu().numpy():
                if id in self.TRACKING_CLASS:
                    dets.append(([int(x1), int(y1), int(x2 - x1), int(y2 - y1)], conf, id))
            if dets:
                # Object tracking
                tracks = self.object_tracker.update_tracks(dets, frame=origin_frame)
            
                track_info = [(track.to_tlbr(), track.get_det_conf(), track.get_det_class(), track.track_id)for track in tracks]
               
                track_dets, track_confs, track_classes, track_ids = zip(*track_info)
                mask = np.array([conf is not None for conf in track_confs])
        return track_dets, track_ids
    
    def bytetrack(self, results, frame):
        result = results[0]
        detections = self.extract_class_0_detections(result)
        self.bytetracker.update_with_detections(detections) #
        detections = self.bytetracker.update_with_detections(detections)
        vehicle_track_dets, vehicle_track_ids = detections.xyxy, detections.tracker_id
        track_dets = tuple(np.array(row, dtype=np.float32) for row in vehicle_track_dets)
        track_ids = tuple(np.array(row, dtype=np.float32) for row in vehicle_track_ids)
        return track_dets, track_ids
    
    
    def extract_class_0_detections(self, results):
        boxes = results.boxes.xyxy.cpu().numpy()  # Tọa độ bounding box [x1, y1, x2, y2]
        confidence = results.boxes.conf.cpu().numpy()  # Độ tin cậy
        class_id = results.boxes.cls.cpu().numpy().astype(int)  # ID lớp
        class_names = np.array([results.names[cid] for cid in class_id])  # Tên lớp

        # Lọc các detections có class_id = 0
        mask = class_id == 0
        filtered_detections = Detections(
            xyxy=boxes[mask],
            confidence=confidence[mask],
            class_id=class_id[mask],
            tracker_id=None,
            data={'class_name': class_names[mask]}
        )
        
        return filtered_detections