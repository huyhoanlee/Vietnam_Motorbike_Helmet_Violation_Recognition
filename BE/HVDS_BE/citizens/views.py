from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import CitizenSerializer, CitizenStatusCountSerializer, CitizenChangeEmailSerializer, CarParrotRegisterSerializer, CarParrotResponseSerializer, CitizenApplicationsSerializer, CitizenUpdateSerializer, CitizenResponseSerializer
from .models import Citizen
from rest_framework.views import APIView
from rest_framework import status
from .serializers import CitizenAuthSerializer
from rest_framework.permissions import AllowAny
from car_parrots.models import CarParrots
from vehicles.models import Vehicle
from .utils import call_api, email_api
from django.db.models import Count

class CitizenGetAllSubmittedView(generics.ListAPIView):
    serializer_class = CitizenSerializer
    queryset = Citizen.objects.filter(status="Submitted")
    
class CitizenGetAllView(generics.ListAPIView):
    serializer_class = CitizenSerializer
    queryset = Citizen.objects.all()

class CitizenVerifyView(generics.UpdateAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = "Verified"
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CitizenRejectView(generics.UpdateAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = "Rejected"
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CitizenCheckCarParrotView(generics.UpdateAPIView):
    queryset = Citizen.objects.all()
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        if CarParrots.objects.filter(plate_number=request.data["plate_number"], status="Verified").exists():
            return Response({
                "is_owned": True
                }, status=status.HTTP_201_CREATED)
        return Response({
            "is_owned": False
        }, status=status.HTTP_201_CREATED)

class CarParrotRegisterView(generics.CreateAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CarParrotRegisterSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        citizen = self.get_object()
        if CarParrots.objects.filter(plate_number=request.data["plate_number"], status="Verified").exists():
            all_car_parrots = CarParrots.objects.filter(citizen_id=citizen)
            response_serializer = CarParrotResponseSerializer(all_car_parrots, many=True)
            return Response({
            "message": "Plate number already registered.",
            "car_parrot": response_serializer.data,
            "is_owned": True,
        }, status=status.HTTP_201_CREATED)
 
        data = request.data.copy() 
        data['citizen_id'] = citizen.id 
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        vehicle, _ = Vehicle.objects.get_or_create(plate_number=instance.plate_number)
        vehicle.car_parrot_id = instance
        vehicle.save()
        
        all_car_parrots = CarParrots.objects.filter(citizen_id=citizen)
        response_serializer = CarParrotResponseSerializer(all_car_parrots, many=True)
        return Response({
            "message": "Car plate registered successfully.",
            "car_parrot": response_serializer.data,
            "is_owned": False,
            "id": instance.id
        }, status=status.HTTP_201_CREATED)
            
class CitizenApplicationsView(generics.RetrieveAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenApplicationsSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        application = CarParrots.objects.filter(citizen_id=instance)
        response_serializer = CarParrotResponseSerializer(application, many=True)
        return Response({
            "citizen_id": data['id'],
            "applications": response_serializer.data
        }, status=status.HTTP_200_OK)

class CitizenAuthView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = CitizenAuthSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data.get('phone_number')
        code_authen = serializer.validated_data.get('code_authen')

        if not code_authen:
            generated_authen = serializer.validated_data.get('generated_authen')
            exp = serializer.validated_data.get('exp')
            output = call_api(phone_number, exp, generated_authen)
            return Response({
                "message": "OTP sent to phone number successfully."
            }, status=status.HTTP_200_OK)

        citizen = serializer.save()
        return Response({
            "message": "Citizen registered successfully.",
            "data": {
                "id": citizen.id,
                "role": "Citizen"
                }
        }, status=status.HTTP_201_CREATED)
        
class CitizenChangeEmailView(generics.UpdateAPIView):
    permission_classes = [AllowAny]
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    lookup_field = 'id'
    
    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        request.data["phone_number"] = instance.phone_number
        serializer = CitizenChangeEmailSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get('email')
        code_authen = serializer.validated_data.get('code_authen')

        if not code_authen:
            generated_authen = serializer.validated_data.get('generated_authen')
            exp = serializer.validated_data.get('exp')
            output = email_api(email, exp, generated_authen)
            return Response({
                "message": "OTP sent to email successfully."
            }, status=status.HTTP_200_OK)

        citizen = serializer.save()
        return Response({
            "message": "Citizen Change email successfully.",
            "data": {
                "id": citizen.id,
                "email": citizen.email
                }
        }, status=status.HTTP_201_CREATED)
        
class CitizenUpdateView(generics.UpdateAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenUpdateSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        response_serializer = CitizenResponseSerializer(instance)
        return Response({
            "message": "Citizen information updated successfully",
            "data": response_serializer.data
        }, status=status.HTTP_200_OK)
        
class CitizenInformationView(generics.RetrieveAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]
    
class CitizenCountByStatusView(APIView):
    def get(self, request):
        counts = Citizen.objects.values('status').annotate(count=Count('id'))
        serializer = CitizenStatusCountSerializer(counts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)