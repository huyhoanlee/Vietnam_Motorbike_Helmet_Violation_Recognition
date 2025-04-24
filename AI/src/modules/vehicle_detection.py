from typing import List, Union
import sys
import os
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

class VehicleDetector:
    def __init__(self, model):
        self.model = model

    def detect(self, origin_frame: Union[np.ndarray, List[np.ndarray]]) -> List:
        results = self.model(origin_frame, conf=0.25, verbose = False)
        return results