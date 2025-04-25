from django.db import models

class ViolationStatus(models.Model):
    id = models.AutoField(primary_key=True)
    status_name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=255)

    def __str__(self):
        return self.status_name
    
    