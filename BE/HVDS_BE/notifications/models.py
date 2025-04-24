from django.db import models
from violations.models import Violation

class Notification(models.Model):
    id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    violation_id = models.ForeignKey(Violation, on_delete=models.deletion.CASCADE)
    
    