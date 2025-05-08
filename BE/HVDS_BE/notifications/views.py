from rest_framework.response import Response
from rest_framework import status, permissions, generics
from .models import Notification
from violations.models import Violation
from .serializers import NotificationSerializer, NotificationDetailSerializer

class NotificationViewAllView(generics.ListAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get all violation notifications successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

class NotificationSearchByViolationView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        violation_id = self.request.query_params.get('violation_id')
        violation = Violation.objects.get(id=violation_id)
        if violation:
            return Notification.objects.filter(violation_id=violation)
        return Notification.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get all violation notifications successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

class NotificationSearchByStatusView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        status = self.request.query_params.get('status')  # Dùng status thay vì status_id vì trường là CharField
        if status:
            return Notification.objects.filter(status=status)
        return Notification.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get all violation notifications successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

class NotificationDetailView(generics.RetrieveAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationDetailSerializer
    lookup_field = 'id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            "message": "Get information of notification successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)