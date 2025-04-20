# src/models/schema.py
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import time
import numpy as np
from typing_extensions import TypedDict
from enum import Enum

class FrameData(TypedDict):
    """Data structure for a video frame with metadata"""
    url: str
    frame: np.ndarray
    frame_count: int

class ViolationType(str, Enum):
    NO_HELMET = "no_helmet"
    
class DetectedResult(BaseModel):
    vehicle_id: str
    image: str  #  base64
    violation: Optional[ViolationType]
    plate_numbers: str | None
    time: str | None
    plate_conf: float
    camera_id: str | None
    
    def __getitem__(self, item):
        return getattr(self, item)
    
    def __setitem__(self, key, value):
        object.__setattr__(self, key, value)

class DeviceDetection(BaseModel):
    camera_id: str # URL
    post_frame: bytes  # image base64
    detected_result: List[DetectedResult] = []

    def __getitem__(self, item):
        return getattr(self, item)
    
    def __setitem__(self, key, value):
        object.__setattr__(self, key, value)
        

class AIResult(BaseModel):
    """Model for the complete AI processing result"""
    time: float
    device_list: List[DeviceDetection] = Field(default_factory=list)