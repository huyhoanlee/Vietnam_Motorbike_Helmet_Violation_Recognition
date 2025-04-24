from django.db import models
from notifications.models import Notification

class Mail(models.Model):
    id = models.AutoField(primary_key=True)
    message = models.TextField()
    created_at = models.DateTimeField()
    to_email = models.CharField(max_length=255)
    notification_id = models.ForeignKey(Notification, on_delete=models.deletion.CASCADE)

    def __str__(self):
        return self.id