from rest_framework import generics, status
from rest_framework.views import APIView
from .models import Violation
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from datetime import datetime, timedelta
from django.utils import timezone
from violation_status.models import ViolationStatus
from .utils import post_process_change_status
from .serializers import ViolationSerializer, ViolationStatusChangeSerializer, ViolationResponseSerializer, ViolationSearchSerializer, ViolationReportSerializer, ViolationByCitizenSerializer, ViolationCreateSerializer

class ViolationCreateView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = ViolationCreateSerializer(data={"violations": request.data})
        serializer.is_valid(raise_exception=True)

        results = serializer.save()
        for result in results:
            violation = Violation.objects.get(id=result["violation_id"])
            if violation.violation_status_id.status_name == "AI reliable":
                post_process_change_status(violation)

        return Response({
            "message": "Violations processed successfully",
            "data": results
        }, status=status.HTTP_201_CREATED)

class ViolationListView(generics.ListAPIView):
    queryset = Violation.objects.all()
    serializer_class = ViolationSearchSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get all violations successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

class ViolationChangeStatusView(generics.UpdateAPIView):
    queryset = Violation.objects.all()
    serializer_class = ViolationStatusChangeSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        
        status_id = serializer.validated_data['status_id']
        new_status = ViolationStatus.objects.get(id=status_id)
        instance.violation_status_id = new_status
        instance.save()
        
        if new_status.status_name == "Verified":
            post_process_change_status(instance)

        response_serializer = ViolationResponseSerializer(instance)
        return Response({
            "message": "Change status successfully",
            "data": response_serializer.data
        }, status=status.HTTP_200_OK)
        
class ViolationSearchByLocationView(generics.ListAPIView):
    serializer_class = ViolationSerializer

    def get_queryset(self):
        location_id = self.request.query_params.get('location_id')
        if location_id:
            return Violation.objects.filter(camera_id__location=location_id)
        return Violation.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Search violation by location id successfully",
            "data": {"violations": serializer.data}
        }, status=status.HTTP_200_OK)

class ViolationSearchByTimeView(generics.ListAPIView):
    serializer_class = ViolationSearchSerializer

    def get_queryset(self):
        start_time = self.request.query_params.get('start_time')
        end_time = self.request.query_params.get('end_time')
        if start_time:
            start_dt = datetime.strptime(start_time, '%d/%m/%Y')
            start_dt = timezone.make_aware(start_dt)  # Make timezone-aware
        else:
            return Violation.objects.all()

        # If end_time is provided, parse it; otherwise, use end of start_time day
        if end_time:
            end_dt = datetime.strptime(end_time, '%d/%m/%Y')
            end_dt = timezone.make_aware(end_dt.replace(hour=23, minute=59, second=59))
        else:
            end_dt = start_dt.replace(hour=23, minute=59, second=59)

        if start_dt > end_dt:
            return Violation.objects.none()

        return Violation.objects.filter(detected_at__range=[start_dt, end_dt])

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Search violation by location id successfully",
            "data": {"violations": serializer.data}
        }, status=status.HTTP_200_OK)
        
class ViolationSearchByPlateNumberView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        plate_number = request.data.get('plate_number')
        print('plate_number:', plate_number)
        if plate_number:
            queryset = Violation.objects.filter(vehicle_id__plate_number=plate_number)
        else:
            queryset = Violation.objects.none()
        
        serializer = ViolationSearchSerializer(queryset, many=True)
        return Response({
            "message": "Search violation by plate_number successfully",
            "data": {"violations": serializer.data}
        }, status=status.HTTP_200_OK)

class ViolationReportView(generics.CreateAPIView):
    queryset = Violation.objects.all()
    serializer_class = ViolationReportSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(serializer.to_representation(instance), status=status.HTTP_201_CREATED)
        
class ViolationSearchByCitizenView(generics.ListAPIView):
    serializer_class = ViolationSearchSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        citizen_id = self.request.query_params.get('citizen_id')
        print(citizen_id)
        if citizen_id:
            return Violation.objects.filter(
                vehicle_id__car_parrot_id__citizen_id__id=citizen_id,
                vehicle_id__car_parrot_id__status='Verified'
            )
        return Violation.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Search violation by citizen id successfully",
            "data": {"violations": serializer.data}
        }, status=status.HTTP_200_OK)