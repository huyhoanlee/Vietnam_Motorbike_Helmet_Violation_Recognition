from pydantic import BaseModel
from typing import List, Optional, Any
from enum import Enum

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
    camera_id: str
    post_frame: bytes  # image base64
    detected_result: List[DetectedResult] = []

    def __getitem__(self, item):
        return getattr(self, item)
    
    def __setitem__(self, key, value):
        object.__setattr__(self, key, value)
        
class FrameData(BaseModel):
    url: str
    frame: Any
    frame_count: int
    
    def __getitem__(self, item):
        return getattr(self, item)
    
    def __setitem__(self, key, value):
        object.__setattr__(self, key, value)