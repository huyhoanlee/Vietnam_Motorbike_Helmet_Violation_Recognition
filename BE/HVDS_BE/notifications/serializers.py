from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    plate_num = serializers.CharField(source="plate_num.plate_number")

    class Meta:
        model = Notification
        fields = ["id", "plate_num", "status", "image_url", "location"]
