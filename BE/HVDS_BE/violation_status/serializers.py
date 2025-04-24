from rest_framework import serializers
from .models import ViolationStatus

class CreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ViolationStatus
        fields = ['status_name', 'description']
        
class ViolationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ViolationStatus
        fields = '__all__'
        
class ViolationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ViolationStatus
        fields = ['status_name', 'description']

class ViolationStatusResponseSerializer(serializers.ModelSerializer):
    violation_status_id = serializers.IntegerField(source='id')
    satus_name = serializers.CharField(source='status_name')  # Typo as per output spec

    class Meta:
        model = ViolationStatus
        fields = ['violation_status_id', 'satus_name', 'description']