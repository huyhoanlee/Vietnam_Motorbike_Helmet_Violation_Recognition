from django.db import models

class Camera(models.Model):
    device_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    last_active = models.CharField(max_length=255)
    note = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.device_name
