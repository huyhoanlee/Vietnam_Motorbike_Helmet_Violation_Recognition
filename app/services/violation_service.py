from typing import Dict, Optional
from ai_models.utils.license_plate_processor import LicensePlateProcessor
from database.database_manager import DatabaseManager
import uuid
import os

class ViolationService:
    def __init__(self):
        """Initialize service with dependencies"""
        self.processor = LicensePlateProcessor()
        self.db_manager = DatabaseManager()
        self.upload_dir = 'uploads'
        os.makedirs(self.upload_dir, exist_ok=True)

    def process_image(self, image_data: bytes) -> Dict:
        """Process uploaded image and save violation data"""
        import cv2
        import numpy as np
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process image
        result = self.processor.process_image(image)
        
        # Save image to uploads directory
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(self.upload_dir, filename)
        cv2.imwrite(filepath, image)
        
        # Save violation data
        violation_data = {
            'license_plates': [],
            'helmet_status': not result['helmet_detected'],
            'image_path': filepath
        }
        
        if result['license_plates']:
            for plate in result['license_plates']:
                violation = self.db_manager.add_violation(
                    license_plate=plate['text'],
                    helmet_status=violation_data['helmet_status'],
                    image_path=filepath
                )
                violation_data['license_plates'].append({
                    'text': plate['text'],
                    'confidence': plate['confidence']
                })
        
        return violation_data

    def get_violations(self, limit: int = 100, offset: int = 0) -> Dict:
        """Get list of violations"""
        violations = self.db_manager.get_violations(limit, offset)
        return {
            'count': len(violations),
            'results': violations
        }

    def get_violation(self, violation_id: int) -> Optional[Dict]:
        """Get single violation by ID"""
        return self.db_manager.get_violation(violation_id)

    def update_violation_status(self, violation_id: int, status: str) -> bool:
        """Update violation status"""
        return self.db_manager.update_violation_status(violation_id, status)
