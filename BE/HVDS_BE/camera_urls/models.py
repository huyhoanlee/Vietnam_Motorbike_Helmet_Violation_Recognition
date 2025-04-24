from django.db import models

class CameraUrl(models.Model):
    id = models.AutoField(primary_key=True)
    input_url = models.CharField(max_length=255)
    output_url = models.CharField(max_length=255)

    def __str__(self):
        return self.id
