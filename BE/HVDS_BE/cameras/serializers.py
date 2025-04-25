from rest_framework import serializers
from .models import Camera
from camera_urls.models import CameraUrl
from locations.models import Location
import requests

URL = "http://58.8.184.170:55143"
class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camera
        fields = ["id", "device_name", "location_id", "status", "last_active"]
        extra_kwargs = {
            "status": {"required": False, "allow_null": True},
            "last_active": {"required": False, "allow_null": True},
            "url": {"required": False, "allow_null": True},
        }

class CameraInformationSerializer(serializers.ModelSerializer):
    camera_id = serializers.IntegerField(source='id')
    location = serializers.SerializerMethodField()
    last_active = serializers.SerializerMethodField()

    class Meta:
        model = Camera
        fields = ['camera_id', 'device_name', 'status', 'location', 'last_active']
        extra_kwargs = {
            'status': {'required': False, 'allow_null': True},
            'last_active': {'required': False, 'allow_null': True},
        }
    def get_location(self, obj):
        if obj.location_id:
            location = obj.location_id
            return f"{location.name}, {location.road}, {location.dist}, {location.city}"
        return None

    def get_last_active(self, obj):
        if obj.last_active:
            return obj.last_active.strftime('%d/%m/%Y')  # Định dạng DD/MM/YYYY
        return None
    
class StreamingSerializer(serializers.ModelSerializer):
    input_url = serializers.CharField(source='camera_url_id.input_url', read_only=True)
    output_url = serializers.CharField(source='camera_url_id.output_url', read_only=True)
    location = serializers.SerializerMethodField()

    class Meta:
        model = Camera
        fields = ['id', 'input_url', 'output_url', 'location']
        read_only_fields = ['id']
        
    def get_location(self, obj):
        if obj.location_id:
            location = obj.location_id
            return f"{location.name}, {location.road}, {location.dist}, {location.city}"
        return None

class CameraCreateSerializer(serializers.ModelSerializer):
    url_input = serializers.CharField(write_only=True)  
    location = serializers.SerializerMethodField()

    class Meta:
        model = Camera
        fields = ['id', 'device_name', 'status', 'url_input', 'location_id', 'location']
        read_only_fields = ['id']
        
    def get_location(self, obj):
        if obj.location_id:
            location = obj.location_id
            return f"{location.name}, {location.road}, {location.dist}, {location.city}"
        return None
        
    def validate(self, data):
        value = data.get('url_input')
        if CameraUrl.objects.filter(input_url=value).exists():
            raise serializers.ValidationError({"message": "Camera has existed"})

        try:
            response = requests.get(value, timeout=10, allow_redirects=True)
            if response.status_code != 200:
                raise serializers.ValidationError({"message": "Input url is fake"})
            
            content_type = response.headers.get('Content-Type', '').lower()
            if not (content_type.startswith('image/') or content_type.startswith('video/')):
                if content_type not in ('application/octet-stream', ''):
                    raise serializers.ValidationError({"message": "Input url is fake"})
                
        except requests.RequestException:
            raise serializers.ValidationError({"message": "Input url is fake"})
        
        return data

    def create(self, validated_data):
        input_url = validated_data.pop('url_input')
        location_id = validated_data.pop('location_id')
        
        push_url_response = requests.post(f"{URL}/push_url?url={input_url}")
        if push_url_response.status_code == 200:
            output = push_url_response.json()
            output_url = output.get("url", "")
        else:
            raise serializers.ValidationError({"message": "Failed to get output_url from external API"})

        camera_url = CameraUrl.objects.create(
            input_url=input_url,
            output_url=output_url
        )

        camera = Camera.objects.create(
            device_name=validated_data['device_name'],
            status=validated_data['status'],
            location_id=location_id,
            camera_url_id=camera_url
        )
        self.output_url = output_url
        return camera
    
    
class CameraChangeStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camera
        fields = ['id', 'status']
    
    def update(self, instance, validated_data):
        push_url_response = requests.post(f"{URL}/delete_url?url={instance.camera_url_id.input_url}")
        if push_url_response.status_code != 200:
            raise serializers.ValidationError("Failed to update output_url")

class CameraUpdateSerializer(serializers.ModelSerializer):
    input_url = serializers.CharField(write_only=True, required=False)
    location_id = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), required=False)

    class Meta:
        model = Camera
        fields = ['id', 'device_name', 'input_url', 'location_id']

    def update(self, instance, validated_data):
        if 'device_name' in validated_data:
            instance.device_name = validated_data['device_name']
        if 'location_id' in validated_data:
            instance.location_id = validated_data['location_id']
        if 'input_url' in validated_data:
            input_url = validated_data['input_url']
            push_url_response = requests.post(f"{URL}/push_url?url={input_url}")
            if push_url_response.status_code == 200:
                output = push_url_response.json()
                output_url = output.get("url", "")
                instance.camera_url_id.input_url = input_url
                instance.camera_url_id.output_url = output_url
                instance.camera_url_id.save()
            else:
                raise serializers.ValidationError("Failed to update output_url")

        instance.save()
        return instance

class CameraResponseSerializer(serializers.ModelSerializer):
    input_url = serializers.CharField(source='camera_url_id.input_url')
    name = serializers.CharField(source='location_id.name')
    road = serializers.CharField(source='location_id.road')
    dist = serializers.CharField(source='location_id.dist')

    class Meta:
        model = Camera
        fields = ['id', 'device_name', 'input_url', 'name', 'road', 'dist']