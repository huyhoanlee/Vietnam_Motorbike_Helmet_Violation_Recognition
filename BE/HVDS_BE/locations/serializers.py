from rest_framework import serializers
from .models import Location

class CreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['name', 'road', 'dist', 'city']
        
class ListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'
        
class CityListSerializer(serializers.Serializer):
    cities = serializers.ListField(child=serializers.CharField())

class DistrictListSerializer(serializers.Serializer):
    city = serializers.CharField(required=True)


class RoadListSerializer(serializers.Serializer):
    city = serializers.CharField(required=True)
    district = serializers.CharField(required=True)