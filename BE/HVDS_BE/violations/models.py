from django.db import models
from vehicles.models import Vehicle
from cameras.models import Camera

class Violation(models.Model):
    plate_num = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    camera_id = models.ForeignKey(Camera, on_delete=models.CASCADE)
    status = models.CharField(max_length=255)
    image_url = models.TextField()
    location = models.CharField(max_length=255)
    detected_at = models.DateTimeField()

    def __str__(self):
        return f"Violation {self.plate_num} at {self.location}"
