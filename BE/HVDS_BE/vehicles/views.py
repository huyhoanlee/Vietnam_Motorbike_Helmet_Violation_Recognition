from rest_framework import generics, permissions
from .models import Vehicle
from .serializers import VehicleSerializer

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

# GET: get 1 camera
# PUT/PATCH: update
# DELETE: delete
class VehicleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]
