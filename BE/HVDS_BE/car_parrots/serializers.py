# carparrots/serializers.py
from rest_framework import serializers
from .models import CarParrots
from citizens.models import Citizen

class CarParrotsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarParrots
        fields = "__all__"
        
class CitizenCarParrotSerializer(serializers.ModelSerializer):
    citizen_id = serializers.SerializerMethodField()
    card_parrots = CarParrotsSerializer(source='carparrots_set', many=True)
    status = serializers.CharField()  # From Citizen.status

    class Meta:
        model = Citizen
        fields = "__all__"

    def get_citizen_id(self, obj):
        return f"CIT{obj.id:03d}"
        
class CarParrotUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarParrots
        fields = '__all__'
        extra_kwargs = {
            'plate_number': {'required': False},
            'image': {'required': False},
        }

class CarParrotResponseSerializer(serializers.ModelSerializer):
    car_parrot_id = serializers.IntegerField(source='id')

    class Meta:
        model = CarParrots
        fields = '__all__'