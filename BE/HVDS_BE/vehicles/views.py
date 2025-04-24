from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from .models import Vehicle
from .serializers import VehicleSerializer, VehicleUpdateSerializer, VehicleSearchSerializer, SearchCitizenInputSerializer

# GET: get all  
# POST: create new
class VehicleListCreateView(generics.ListCreateAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

# PUT/PATCH: update
class VehicleUpdateView(generics.UpdateAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "pk"
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            vehicle = serializer.save()
            response_serializer = VehicleSerializer(vehicle)
            return Response(response_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VehicleSearchByCitizenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        input_serializer = SearchCitizenInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        citizen_id = input_serializer.validated_data['citizen_id']

        # Lấy queryset
        queryset = Vehicle.objects.filter(
            car_parrot_id__citizen_id=citizen_id,
            car_parrot_id__status='Verified'
        )

        # Serialize output
        serializer = VehicleSearchSerializer(queryset, many=True)
        return Response({
            "message": "Get all vehicles by citizen id successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)