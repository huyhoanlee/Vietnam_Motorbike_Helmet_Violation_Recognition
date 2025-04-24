from django.db import models
from car_parrots.models import CarParrots

class Vehicle(models.Model):
    id = models.AutoField(primary_key=True)
    plate_number = models.CharField(max_length=255)
    car_parrot_id = models.ForeignKey(CarParrots, on_delete=models.deletion.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.plate_number
