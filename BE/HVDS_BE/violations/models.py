from django.db import models
from violation_status.models import ViolationStatus
from vehicles.models import Vehicle
from violation_images.models import ViolationImages
from cameras.models import Camera

class Violation(models.Model):
    id = models.AutoField(primary_key=True)
    detected_at = models.DateTimeField(auto_now_add=True)
    tracking_id = models.CharField(max_length=255, null=True, blank=True)
    max_confidence = models.FloatField(null=True, blank=True)
    violation_status_id = models.ForeignKey(ViolationStatus, on_delete=models.CASCADE)
    camera_id = models.ForeignKey(Camera, on_delete=models.CASCADE, null=True, blank=True)
    vehicle_id = models.ForeignKey(Vehicle, on_delete=models.CASCADE)

