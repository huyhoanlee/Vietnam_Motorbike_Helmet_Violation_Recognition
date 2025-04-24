from django.db import models
from citizens.models import Citizen

class CarParrots(models.Model):
    id = models.AutoField(primary_key=True)
    image = models.TextField()  # BASE64_ENCODED_CARD
    status = models.CharField(
        max_length=9,
        choices=[('Submitted', 'Submitted'), ('Verified', 'Verified')],
        default='Submitted',
        verbose_name='Status of registration: [Submitted, Verified]'
    )
    plate_number = models.CharField(max_length=255)
    owner = models.CharField(max_length=255) 
    address = models.CharField(max_length=255)
    modelCode = models.CharField(max_length=50)
    color = models.CharField(max_length=50)
    citizen_id = models.ForeignKey(Citizen, on_delete=models.CASCADE)

    def __str__(self):
        return self.status