from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import CarParrots
from citizens.models import Citizen
from vehicles.models import Vehicle
from .serializers import CarParrotsSerializer, CarParrotUpdateSerializer, CitizenCarParrotSerializer, CarParrotResponseSerializer

class CarParrotsListView(generics.ListAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenCarParrotSerializer
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CarParrotsDetailView(generics.RetrieveAPIView):
    queryset = CarParrots.objects.all()
    serializer_class = CarParrotsSerializer
    lookup_field = 'id'

class CarParrotsVerifyView(generics.UpdateAPIView):
    queryset = CarParrots.objects.all()
    serializer_class = CarParrotsSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = 'Verified'
        instance.save()
        
        vehicle, _ = Vehicle.objects.get_or_create(plate_number=instance.plate_number)
        vehicle.car_parrot_id = instance
        vehicle.save()
        
        serializer = self.get_serializer(instance)
        return Response({"message": "Verified for registrations car successfully","data":serializer.data}, status=status.HTTP_200_OK)
    
class CarParrotUpdateView(generics.UpdateAPIView):
    queryset = CarParrots.objects.all()
    serializer_class = CarParrotUpdateSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        response_serializer = CarParrotResponseSerializer(instance)
        return Response({
            "card_parrot": [response_serializer.data]  # Trả về dưới dạng list
        }, status=status.HTTP_200_OK)