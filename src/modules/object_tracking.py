from deep_sort_realtime.deepsort_tracker import DeepSort
import torch
import numpy as np
import cv2
from src.modules.vehicle_detection import VehicleDetector

class ObjectTracker:
    def __init__(self, model):
        self.tracked_objects = []
        self.object_tracker = model

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
        return track_dets, track_confs, track_classes, track_ids, mask