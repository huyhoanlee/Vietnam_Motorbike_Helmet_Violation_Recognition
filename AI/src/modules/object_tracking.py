from deep_sort_realtime.deepsort_tracker import DeepSort
import torch
import numpy as np
import cv2
from src.modules.vehicle_detection import VehicleDetector

class ObjectTracker:
    def __init__(self):

        if torch.cuda.is_available():
            self.device = torch.device("cuda")
            use_gpu = True
        else:
            self.device = torch.device("cpu")
            use_gpu = False
        
        self.tracked_objects = []
        # self.object_tracker = DeepSort(max_age=3,
        #                         n_init=2,
        #                         nms_max_overlap=1.0,
        #                         max_cosine_distance=0.3,
        #                         nn_budget=None,
        #                         override_track_class=None,
        #                         embedder="mobilenet",
        #                         half=True,
        #                         bgr=True,
        #                         embedder_gpu=use_gpu,
        #                         embedder_model_name=None,
        #                         embedder_wts=None,
        #                         polygon=False,
        #                         today=None)
        self.object_tracker = DeepSort(
                            max_age=3,  
                            n_init=2,  
                            nms_max_overlap=1.0,  # Avoid redundant overlap checks
                            max_cosine_distance=0.2,  # Faster similarity checks
                            nn_budget=50,  # Limit embedding storage
                            embedder="mobilenet",
                            embedder_model_name="mobilenetv2_x1_0",  # Smaller & faster version
                            embedder_gpu=True,  
                            half=True,  # Use FP16 for speed
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
        return track_dets, track_confs, track_classes, track_ids, mask
    
# # Usage
# if __name__ == "__main__":
#     tracker = ObjectTracker()
#     model = VehicleDetector()

#     origin_frame = cv2.imread("CAM013_20250214_1108_Mua_14.jpg")
#     detection_results = model.detect(origin_frame)
    
    
#     track_dets, track_confs, track_classes, track_ids, mask = tracker.track(detection_results, origin_frame)
    
#     for i, (bbox, conf, class_id, track_id) in enumerate(zip(track_dets, track_confs, track_classes, track_ids)):
#         if mask[i]:
#             cv2.rectangle(origin_frame, (int(bbox[0]), int(bbox[1])), (int(bbox[2]), int(bbox[3])), (255, 0, 0), 2)
#             cv2.putText(origin_frame, f"[{class_id, track_id}]", (int(bbox[0]), int(bbox[1]) - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
#     cv2.imshow('sdfas', origin_frame)
#     cv2.waitKey(0)
