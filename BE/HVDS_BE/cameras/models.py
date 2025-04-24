from django.db import models
from locations.models import Location
from camera_urls.models import CameraUrl

class Camera(models.Model):
    id = models.AutoField(primary_key=True)
    device_name = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    last_active = models.DateTimeField(null=True)
    location_id = models.ForeignKey(Location, on_delete=models.deletion.CASCADE)
    camera_url_id = models.ForeignKey(CameraUrl, on_delete=models.deletion.CASCADE)

    def __str__(self):
        return self.device_name