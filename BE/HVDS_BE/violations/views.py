from rest_framework import generics, status
from rest_framework.views import APIView
from .models import Violation
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.paginator import Paginator
from django.db import connection
from violation_status.models import ViolationStatus
from .utils import post_process_change_status
from .serializers import ViolationStatusCountSerializer
from django.db.models import Count
from .serializers import *

class ViolationCreateView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = ViolationCreateSerializer(data={"violations": request.data})
        serializer.is_valid(raise_exception=True)

        results = serializer.save()
        for result in results:
            violation = Violation.objects.get(id=result["violation_id"])
            # if violation.violation_status_id.status_name == "AI reliable":
            #     post_process_change_status(violation)

        return Response({
            "message": "Violations processed successfully",
            "data": results
        }, status=status.HTTP_201_CREATED)
        
queryset = Violation.objects.order_by('-detected_at')
paginator = Paginator(queryset, per_page=1)

class ViolationListView(generics.ListAPIView):
    serializer_class = ViolationSearchSerializer

    def get_queryset(self):
        per_page = max(1, int(self.request.query_params.get('per_page', 50)))
        page_number = max(1, int(self.request.query_params.get('page_number', 1)))
        offset = (page_number - 1) * per_page

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT * FROM {Violation._meta.db_table}
                ORDER BY detected_at DESC
                LIMIT %s OFFSET %s
                """,
                [per_page, offset]
            )
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                return [Violation(**row) for row in results]
            return []

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "Get violations successfully",
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
        
        # if new_status.status_name == "Verified":
        #     post_process_change_status(instance)

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
            start_dt = timezone.make_aware(start_dt)
        else:
            return Violation.objects.all()

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
            "message": "Search violation by time successfully",
            "data": {"violations": serializer.data}
        }, status=status.HTTP_200_OK)
        
class ViolationSearchByPlateNumberView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        plate_number = request.data.get('plate_number')
        if plate_number:
            normalized_plate_number = ''.join(syn for syn in plate_number if syn.isalnum()).upper()
            queryset = Violation.objects.filter(vehicle_id__normalized_plate_number=normalized_plate_number)
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
    
class ViolationGetReportView(generics.ListAPIView):
    serializer_class = ViolationByCitizenSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        citizen_id = self.kwargs['id']
        citizen = Citizen.objects.get(id=citizen_id)
        return Violation.objects.filter(reported_by=citizen)
        
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
        
class ViolationCountByStatusView(APIView):
    def get(self, request):
        counts = Violation.objects.values('violation_status_id__status_name').annotate(count=Count('id'))
        serializer = ViolationStatusCountSerializer(counts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ViolationCountByLocationView(APIView):
    def get(self, request):
        counts = Violation.objects.values('camera_id__location_id').annotate(count=Count('id'))
        serializer = ViolationLocationCountSerializer(counts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ViolationCountByTimeView(APIView):
    def get(self, request):
        counts = Violation.objects.values('detected_at').annotate(count=Count('id'))
        serializer = ViolationTimeCountSerializer(counts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class ViolationCountAllView(APIView):
    def get(self, request):
        total_count = Violation.objects.count()
        serializer = ViolationCountSerializer({'total_count': total_count})
        return Response(serializer.data, status=status.HTTP_200_OK)