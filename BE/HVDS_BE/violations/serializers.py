# violations/serializers.py
from rest_framework import serializers
from .models import Violation, ViolationStatus, Vehicle, ViolationImages, Citizen
from cameras.models import Camera, CameraUrl
from django.utils import timezone
from django.db import transaction

class ViolationSerializer(serializers.ModelSerializer):
    violation_id = serializers.IntegerField(source='id')
    plate_number = serializers.CharField(source='vehicle_id.plate_number')
    status = serializers.CharField(source='violation_status_id.status_name')

    class Meta:
        model = Violation
        fields = ['violation_id', 'plate_number', 'detected_at', 'camera_id', 'status']
        
class ViolationSearchSerializer(serializers.ModelSerializer):
    violation_id = serializers.IntegerField(source='id')
    plate_number = serializers.CharField(source='vehicle_id.plate_number')
    status_name = serializers.CharField(source='violation_status_id.status_name')
    location = serializers.SerializerMethodField()
    detected_at = serializers.SerializerMethodField()
    violation_image = serializers.SerializerMethodField()

    class Meta:
        model = Violation
        fields = ['violation_id', 'plate_number', 'location', 'detected_at', 'violation_image', 'status_name']

    def get_location(self, obj):
        if obj.camera_id and obj.camera_id.location_id:
            location = obj.camera_id.location_id
            return f"{location.road}, {location.dist}, {location.city}"
        return obj.reported_location

    def get_detected_at(self, obj):
        if obj.detected_at:
            return obj.detected_at.strftime('%Y-%m-%d %H:%M:%S')
        return None

    def get_violation_image(self, obj):
        images = [img.image for img in obj.images.all()]
        return images

class ViolationStatusChangeSerializer(serializers.ModelSerializer):
    status_id = serializers.IntegerField(write_only=True)  # Nhận status_id từ input

    class Meta:
        model = Violation
        fields = ['id', 'status_id']

class ViolationResponseSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='violation_status_id.status_name')
    class Meta:
        model = Violation
        fields = ['id', 'status_name']
        

class ViolationReportSerializer(serializers.ModelSerializer):
    image = serializers.ListField(child=serializers.CharField(), write_only=True)
    plate_number = serializers.CharField(write_only=True)
    reported_location = serializers.CharField(write_only=True)
    reported_by = serializers.CharField(write_only=True)

    class Meta:
        model = Violation
        fields = ['id', 'image', 'plate_number', 'reported_location', 'reported_by']
        read_only_fields = ['id']

    def create(self, validated_data):
        images = validated_data.pop('image')
        plate_number = validated_data.pop('plate_number')
        reported_location = validated_data.pop('reported_location')
        reported_by = validated_data.pop('reported_by')

        normalized_plate_number = ''.join(syn for syn in plate_number if syn.isalnum()).upper()
        vehicle, _ = Vehicle.objects.get_or_create(
            normalized_plate_number=normalized_plate_number,
            plate_number=plate_number)
        status = ViolationStatus.objects.get(status_name='Reported')
        citizen = Citizen.objects.get(id=reported_by)

        violation = Violation.objects.create(
            vehicle_id=vehicle,
            violation_status_id=status,
            camera_id=None,
            reported_location=reported_location,
            reported_by=citizen,
            detected_at=timezone.now()
        )

        for img in images:
            ViolationImages.objects.create(
                violation_id=violation,
                image=img,
                time=timezone.now()
            )

        return violation

    def to_representation(self, instance):
        # Định dạng output theo yêu cầu
        images = [img.image for img in instance.images.all()]
        return {
            "message": "Violation reported successfully",
            "data": {
                "violation_id": instance.id,
                "violation_status": instance.violation_status_id.status_name,
                "image": images,
                "plate_number": instance.vehicle_id.plate_number,
                "location": instance.reported_location
            }
        }
    
class ViolationByCitizenSerializer(serializers.ModelSerializer):
    plate_number = serializers.CharField(source='vehicle_id.plate_number')
    location = serializers.CharField(source='reported_location')
    images = serializers.SerializerMethodField()
    status = serializers.CharField(source='violation_status_id.status_name')

    class Meta:
        model = Violation
        fields = ['id', 'plate_number', 'location', 'images', 'status']

    def get_images(self, obj):
        images = ViolationImages.objects.filter(violation_id=obj.id)
        return [image.image for image in images]
        
        
class ViolationItemSerializer(serializers.Serializer):
    plate_number = serializers.CharField(max_length=255)
    camera_input_url = serializers.CharField(max_length=255)
    status = serializers.CharField(max_length=50, default="AI detected")
    violate_image = serializers.CharField()
    confidence = serializers.FloatField(min_value=0.0, max_value=1.0)
    tracking_id = serializers.CharField(max_length=255)
    time = serializers.DateTimeField()

    def validate_status(self, value):
        allowed_statuses = ["AI detected", "AI reliable"]
        if value not in allowed_statuses:
            raise serializers.ValidationError(f"Status must be one of {allowed_statuses}")
        return value

    def validate_camera_url(self, value):
        if not CameraUrl.objects.filter(input_url=value).exists():
            raise serializers.ValidationError("Camera URL does not exist")
        return value

    def create(self, validated_data):
        plate_number = validated_data['plate_number']
        camera_url = validated_data['camera_input_url']
        image_url = validated_data['violate_image']
        confidence = validated_data['confidence']
        tracking_id = validated_data['tracking_id']
        tracked_time = validated_data['time']
        status = validated_data['status']

        with transaction.atomic():
            normalized_plate_number = ''.join(syn for syn in plate_number if syn.isalnum()).upper()
            vehicle, _ = Vehicle.objects.get_or_create(normalized_plate_number=normalized_plate_number)

            camera_url_obj = CameraUrl.objects.get(input_url=camera_url)
            camera = Camera.objects.filter(camera_url_id=camera_url_obj).first()
            if not camera:
                raise serializers.ValidationError("No camera linked to this URL")

            status_obj, _ = ViolationStatus.objects.get_or_create(status_name=status)
            violation = Violation.objects.filter(tracking_id=tracking_id).first()

            if not violation:
                # Case 1: tracking_id does not exist
                violation = Violation.objects.create(
                    tracking_id=tracking_id,
                    max_confidence=confidence,
                    violation_status_id=status_obj,
                    camera_id=camera,
                    vehicle_id=vehicle
                )
                
            else:
                # Case 2: tracking_id exists
                if confidence > violation.max_confidence:
                    violation.max_confidence = confidence
                    if normalized_plate_number != "None" and violation.vehicle_id.normalized_plate_number != normalized_plate_number:
                        new_vehicle, _ = Vehicle.objects.get_or_create(plate_number=plate_number, normalized_plate_number=normalized_plate_number)
                        violation.vehicle_id = new_vehicle
                    violation.save()
            ViolationImages.objects.create(
                    image=image_url,
                    confidence=confidence,
                    violation_id=violation,
                    time=tracked_time,
                )

            return violation
        
class ViolationCreateSerializer(serializers.Serializer):
    violations = ViolationItemSerializer(many=True)

    def create(self, validated_data):
        results = []
        for item_data in validated_data['violations']:
            serializer = ViolationItemSerializer(data=item_data)
            serializer.is_valid(raise_exception=True)
            violation = serializer.save()
            results.append({
                "violation_id": violation.id,
                "tracking_id": violation.tracking_id
            })
        return results
    
class ViolationStatusCountSerializer(serializers.Serializer):
    status = serializers.CharField(source='violation_status_id__status_name')
    count = serializers.IntegerField()
    
class ViolationLocationCountSerializer(serializers.Serializer):
    location = serializers.CharField(source='camera_id__location_id')
    count = serializers.IntegerField()
    
class ViolationTimeCountSerializer(serializers.Serializer):
    time = serializers.CharField(source='detected_at')
    count = serializers.IntegerField()
    
class ViolationCountSerializer(serializers.Serializer):
    total_count = serializers.IntegerField()
    