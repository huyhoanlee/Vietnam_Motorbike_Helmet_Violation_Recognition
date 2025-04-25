from rest_framework import serializers
from .models import Notification
        
class NotificationSerializer(serializers.ModelSerializer):
    notification_id = serializers.IntegerField(source='id')

    class Meta:
        model = Notification
        fields = ['notification_id', 'status', 'created_at']

class NotificationDetailSerializer(serializers.ModelSerializer):
    notification_id = serializers.IntegerField(source='id')
    status_id = serializers.IntegerField(source='violation_id.id')  # Lấy id của Violation

    class Meta:
        model = Notification
        fields = ['notification_id', 'status_id', 'created_at']