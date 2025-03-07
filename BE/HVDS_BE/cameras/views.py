from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
import requests
import json
from rest_framework import generics
from .serializers import CameraSerializer
from .models import Camera

class ExternalCameraDetailView(APIView):
    def get(self, request, camera_id):
        camera_api_url = f"https://binhdinh.ttgt.vn/api/cameras/{camera_id}"

        try:
            response = requests.get(camera_api_url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return Response(data, status=status.HTTP_200_OK)

            return Response({"error": "Camera not found"}, status=status.HTTP_404_NOT_FOUND)
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# GET: get all cameras 
# POST: create new
class CameraListCreateView(generics.ListCreateAPIView):
    queryset = Camera.objects.all()
    serializer_class = CameraSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

# GET: get 1 camera
# PUT/PATCH: update
# DELETE: delete
class CameraRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Camera.objects.all()
    serializer_class = CameraSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]