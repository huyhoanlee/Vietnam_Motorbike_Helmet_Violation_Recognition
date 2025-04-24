from django.db import models

class ViolationImages(models.Model):
    id = models.AutoField(primary_key=True)
    time = models.DateTimeField()
    image = models.TextField()
    confidence = models.FloatField(null=True)
    violation_id = models.ForeignKey('violations.Violation', on_delete=models.deletion.CASCADE, related_name='images')

    def __str__(self):
        return self.id