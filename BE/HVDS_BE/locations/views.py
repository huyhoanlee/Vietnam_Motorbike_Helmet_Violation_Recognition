from rest_framework import generics, status
from rest_framework.response import Response
from .models import Location
from .serializers import ListSerializer, CreateSerializer

class CreateView(generics.CreateAPIView):
    serializer_class = CreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response({
            "message": "Location created successfully",
            "data": {"location_id": instance.id}
        }, status=status.HTTP_201_CREATED)
    
class ListView(generics.ListAPIView):
    queryset = Location.objects.all()
    serializer_class = ListSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get all Location successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
        
from rest_framework.views import APIView
from .data import LOCATIONS
from .serializers import CityListSerializer, DistrictListSerializer, RoadListSerializer

class CityListView(APIView):
    def get(self, request):
        cities = list(LOCATIONS.keys())
        serializer = CityListSerializer({"cities": cities})
        return Response(serializer.data, status=status.HTTP_200_OK)

class DistrictListView(APIView):
    def get(self, request):
        serializer = DistrictListSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        city = serializer.validated_data['city']
        districts = list(LOCATIONS.get(city, {}).keys())
        return Response({"districts": districts}, status=status.HTTP_200_OK)

class RoadListView(APIView):
    def get(self, request):
        serializer = RoadListSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        city = serializer.validated_data['city']
        district = serializer.validated_data['district']
        roads = LOCATIONS.get(city,{}).get(district,[])
        return Response({"roads": roads}, status=status.HTTP_200_OK)