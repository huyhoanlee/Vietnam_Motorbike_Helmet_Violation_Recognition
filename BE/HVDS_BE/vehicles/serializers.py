from rest_framework import serializers
from .models import Vehicle

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
        extra_kwargs = {
            "owner_name": {"required": False, "allow_null": True},
            "vehicle_type": {"required": False, "allow_null": True}
        }

class VehicleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ["owner_name", "vehicle_type"]
        extra_kwargs = {
            "owner_name": {"required": False, "allow_null": True},
            "vehicle_type": {"required": False, "allow_null": True}
        }

class VehicleSearchSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.IntegerField(source='id')

    class Meta:
        model = Vehicle
        fields = ['vehicle_id', 'plate_number']
        
        
class SearchCitizenInputSerializer(serializers.Serializer):
    citizen_id = serializers.IntegerField(required=True)