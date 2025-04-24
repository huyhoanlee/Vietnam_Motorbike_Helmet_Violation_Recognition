from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import CitizenSerializer, CarParrotRegisterSerializer, CarParrotResponseSerializer, CitizenApplicationsSerializer, CitizenUpdateSerializer, CitizenResponseSerializer
from .models import Citizen
from rest_framework.views import APIView
from rest_framework import status
from .serializers import CitizenAuthSerializer
from rest_framework.permissions import AllowAny
from .utils import call_api

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

class CarParrotRegisterView(generics.CreateAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CarParrotRegisterSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        citizen = self.get_object() 
        data = request.data.copy()
        data['citizen_id'] = citizen.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        response_serializer = CarParrotResponseSerializer(instance)
        return Response({
            "message": "Car plate registered successfully.",
            "car_parrot": response_serializer.data
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
        return Response({
            "citizen_id": data['id'],
            "applications": data['applications']
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