from rest_framework import serializers
from .models import Camera

class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camera
        fields = ["camera_id", "device_name", "location", "status", "last_active", "note"]
