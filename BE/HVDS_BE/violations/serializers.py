from rest_framework import serializers
from .models import Violation

class ViolationSerializer(serializers.ModelSerializer):
    plate_num = serializers.CharField(source="plate_num.plate_number")
    camera_id = serializers.CharField(source="camera_id.camera_id")

    class Meta:
        model = Violation
        fields = ["id", "plate_num", "camera_id", "status", "image_url", "location", "detected_at"]
