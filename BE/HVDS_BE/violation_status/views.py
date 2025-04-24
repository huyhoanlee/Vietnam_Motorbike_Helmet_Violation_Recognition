from rest_framework import generics, status
from rest_framework.response import Response
from .models import ViolationStatus
from .serializers import ViolationStatusSerializer, CreateSerializer, ViolationStatusUpdateSerializer, ViolationStatusResponseSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from violations.models import Violation

class ViolationStatusChangeView(generics.UpdateAPIView):
    queryset = ViolationStatus.objects.all()
    serializer_class = ViolationStatusUpdateSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response_serializer = ViolationStatusResponseSerializer(instance)
        return Response({
            "message": "Updated new status successfully",
            "data": response_serializer.data
        }, status=status.HTTP_200_OK)

class ViolationStatusDeleteView(APIView):
    def delete(self, request, id):
        try:
            status_instance = ViolationStatus.objects.get(id=id)
        except ViolationStatus.DoesNotExist:
            return Response({"message": "Status not found"}, status=status.HTTP_404_NOT_FOUND)

        if Violation.objects.filter(violation_status_id=status_instance).exists():
            return Response({
                "message": "There is violation connect to this status"
            }, status=status.HTTP_400_BAD_REQUEST)

        status_instance.delete()
        return Response({"message": "Deleted status successfully"}, status=status.HTTP_200_OK)

class CreateView(generics.CreateAPIView):
    serializer_class = CreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response({
            "message": "Create new status successfully",
            "data": {"violation_status_id": instance.id,
                     "status_name": instance.status_name,
                     "description": instance.description}
        }, status=status.HTTP_201_CREATED)
    
class ListView(generics.ListAPIView):
    queryset = ViolationStatus.objects.all()
    serializer_class = ViolationStatusSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get all violation status successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)