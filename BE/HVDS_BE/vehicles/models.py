from django.db import models

class Vehicle(models.Model):
    plate_number = models.CharField(max_length=20, unique=True)
    owner_name = models.CharField(max_length=255)
    vehicle_type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.plate_number} - {self.owner_name}"
