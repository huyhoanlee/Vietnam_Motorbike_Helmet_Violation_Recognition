from rest_framework import serializers
from car_parrots.models import CarParrots
from vehicles.models import Vehicle
from .models import Citizen
import random
from django.utils import timezone

class CarParrotRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarParrots
        fields = '__all__'

    def validate_plate_number(self, value):
        if CarParrots.objects.filter(plate_number=value, status="Verified").exists():
            raise serializers.ValidationError("Plate number already registered.")
        return value

    def create(self, validated_data):
        validated_data['status'] = 'Verified'
        car_parrot = CarParrots.objects.create(**validated_data)
        return car_parrot

class CarParrotResponseSerializer(serializers.ModelSerializer):
    car_parrot_id = serializers.IntegerField(source='id')

    class Meta:
        model = CarParrots
        fields = '__all__'

class CarParrotSerializer(serializers.ModelSerializer):
    car_parrot_id = serializers.IntegerField(source='id')

    class Meta:
        model = CarParrots
        fields = ['car_parrot_id', 'plate_number', 'status', 'image']

class CitizenApplicationsSerializer(serializers.ModelSerializer):
    applications = CarParrotSerializer(many=True, source='carparrots_set')

    class Meta:
        model = Citizen
        fields = ['id', 'applications']
        extra_kwargs = {'id': {'read_only': True}}
        
class CitizenChangeEmailSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    code_authen = serializers.CharField(max_length=6, required=False)
    generated_authen = serializers.CharField(max_length=6, required=False)
    exp = serializers.DateTimeField(required=False)
    phone_number = serializers.CharField(max_length=10, required=True)
    
    def validate(self, data):
        phone_number = data.get('phone_number')
        code_authen = data.get('code_authen')

        if not code_authen:
            otp = str(random.randint(100000, 999999))
            data['generated_authen'] = otp
            expires_at = timezone.now() + timezone.timedelta(seconds=300)
            data['exp'] = expires_at
            
            citizen = Citizen.objects.get(phone_number=phone_number)
            citizen.otp = otp
            citizen.expires_at = expires_at
            citizen.save()
            
            print(f"Sending OTP '{otp}' to '{data.get('email')}'")
            return data

        citizen = Citizen.objects.get(phone_number=phone_number)

        if not citizen.otp or not citizen.expires_at:
            raise serializers.ValidationError("No OTP found")

        if timezone.now() > citizen.expires_at:
            raise serializers.ValidationError("Expired OTP")

        if citizen.otp != code_authen:
            raise serializers.ValidationError("Invalid OTP")

        citizen.otp = None
        citizen.expires_at = None
        citizen.email = data.get('email')
        citizen.save()

        return data
    
    def create(self, validated_data):
        citizen = Citizen.objects.get(phone_number=validated_data["phone_number"])
        return citizen
    

class CitizenAuthSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=10, required=True)
    code_authen = serializers.CharField(max_length=6, required=False)
    generated_authen = serializers.CharField(max_length=6, required=False)
    exp = serializers.DateTimeField(required=False)

    def validate(self, data):
        phone_number = data.get('phone_number')
        code_authen = data.get('code_authen')

        if not code_authen:
            otp = str(random.randint(100000, 999999))
            data['generated_authen'] = otp
            expires_at = timezone.now() + timezone.timedelta(seconds=300)
            data['exp'] = expires_at
            
            # Update or create Citizen
            citizen, created = Citizen.objects.get_or_create(
                phone_number=phone_number,
                defaults={
                    'citizen_identity_id': 'Unknown',
                    'full_name': 'Unknown',
                    'email': 'Unknown',
                    'identity_card': 'Unknown',
                    'status': 'Created',
                    'otp': otp,
                    'expires_at': expires_at,
                    'nationality': 'Vietnam',
                }
            )
            if not created:
                citizen.otp = otp
                citizen.expires_at = expires_at
                citizen.save()
            
            print(f"Sending OTP '{otp}' to '{phone_number}'")  # Replace with actual SMS/email
            return data

        # Validate OTP
        try:
            citizen = Citizen.objects.get(phone_number=phone_number)
        except Citizen.DoesNotExist:
            raise serializers.ValidationError("Citizen not found")

        if not citizen.otp or not citizen.expires_at:
            raise serializers.ValidationError("No OTP found")

        if timezone.now() > citizen.expires_at:
            raise serializers.ValidationError("Expired OTP")

        if citizen.otp != code_authen:
            raise serializers.ValidationError("Invalid OTP")

        # Clear OTP after successful validation
        citizen.otp = None
        citizen.expires_at = None
        citizen.save()

        return data

    def create(self, validated_data):
        phone_number = validated_data['phone_number']
        try:
            citizen = Citizen.objects.get(phone_number=phone_number)
        except Citizen.DoesNotExist:
            citizen = Citizen.objects.create(
                phone_number=phone_number,
                citizen_identity_id="Unknown",
                full_name="Unknown",
                email="Unknown",
                identity_card="Unknown",
                status="Created",
                nationality="Vietnam",
            )
        return citizen
    
class CitizenUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizen
        fields = [
            'citizen_identity_id',
            'full_name',
            'email',
            'address',
            'identity_card',
            'dob',
            'place_of_birth',
            'gender',
            'issue_date',
            'place_of_issue',
            'nationality',
        ]
        extra_kwargs = {
            'citizen_identity_id': {'required': False},
            'full_name': {'required': False},
            'email': {'required': False},
            'address': {'required': False, 'allow_null': True},
            'identity_card': {'required': False},
            'dob': {'required': False, 'allow_null': True},
            'place_of_birth': {'required': False, 'allow_null': True},
            'gender': {'required': False, 'allow_null': True},
            'issue_date': {'required': False, 'allow_null': True},
            'place_of_issue': {'required': False, 'allow_null': True},
            'nationality': {'required': False},
        }

    def update(self, instance, validated_data):
        instance.citizen_identity_id = validated_data.get('citizen_identity_id', instance.citizen_identity_id)
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.email = validated_data.get('email', instance.email)
        instance.address = validated_data.get('address', instance.address)
        instance.identity_card = validated_data.get('identity_card', instance.identity_card)
        instance.dob = validated_data.get('dob', instance.dob)
        instance.place_of_birth = validated_data.get('place_of_birth', instance.place_of_birth)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.issue_date = validated_data.get('issue_date', instance.issue_date)
        instance.place_of_issue = validated_data.get('place_of_issue', instance.place_of_issue)
        instance.nationality = validated_data.get('nationality', instance.nationality)
        instance.status = 'Verified'
        instance.save()
        return instance
    
class CitizenResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizen
        fields = ['id', 'citizen_identity_id', 'full_name', 'email', 'address', 'identity_card', 'status']
        
class CitizenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizen
        fields = "__all__"