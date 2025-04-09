from django.db import models
from vehicles.models import Vehicle

class Notification(models.Model):
    plate_num = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    status = models.CharField(max_length=255)
    image_url = models.TextField()
    location = models.CharField(max_length=255)

    def __str__(self):
        return f"Notification for {self.plate_num}"
