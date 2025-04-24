from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework import generics
from .serializers import CameraResponseSerializer, StreamingSerializer, CameraCreateSerializer, CameraChangeStatusSerializer, CameraUpdateSerializer, CameraInformationSerializer
from .models import Camera


class CreateView(generics.CreateAPIView):
    queryset = Camera.objects.all()
    serializer_class = CameraCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        camera = serializer.save()
        return Response({
            "message": "Camera created successfully",
            "data": {
                "camera_id": camera.id,
                "output_url": getattr(serializer, 'output_url', ''),
                "device_name": camera.device_name , 
                "status": camera.status, 
                "location": getattr(serializer, 'location', ''),
                "last_active": camera.last_active
            }
        }, status=status.HTTP_201_CREATED)

    
class ListView(generics.ListAPIView):
    queryset = Camera.objects.all()
    serializer_class = CameraInformationSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get all Camera successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
        
# API POST /change-status/:id
class StreamingView(generics.UpdateAPIView):
    queryset = Camera.objects.all()
    serializer_class = StreamingSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            serializer.data
        , status=status.HTTP_200_OK)

# API POST /update/:id
class CameraUpdateView(generics.UpdateAPIView):
    queryset = Camera.objects.all()
    serializer_class = CameraUpdateSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        response_serializer = CameraResponseSerializer(instance)
        return Response({
            "message": "Camera updated successfully",
            "data": response_serializer.data
        }, status=status.HTTP_200_OK)
        
class CameraChangeStatusView(generics.UpdateAPIView):
    queryset = Camera.objects.all()
    serializer_class = CameraChangeStatusSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        instance.status = serializer.validated_data['status']
        instance.save()
        return Response({
            "message": "Changed status successfully",
            "data": {"camera_id": instance.id, "status": instance.status}
        }, status=status.HTTP_200_OK)