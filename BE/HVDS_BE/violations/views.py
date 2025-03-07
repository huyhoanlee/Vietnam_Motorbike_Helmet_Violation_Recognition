import requests
import json
from datetime import datetime
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Violation
from vehicles.models import Vehicle
from cameras.models import Camera
from .serializers import ViolationSerializer, ViolationCreateUpdateSerializer

class AIViolationDetectionView(APIView):
    def get(self, request):
        ai_service_url = "https://hanaxuan-ai-service.hf.space/result"

        try:
            response = requests.get(ai_service_url, timeout=5)
            response.raise_for_status()  # Kiểm tra lỗi HTTP
            raw_data = response.text  # Nhận dữ liệu thô
            print("Raw API response:", raw_data)

            try:
                data = response.json()
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON response"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 🛠 Nếu dữ liệu không phải là danh sách, bọc nó vào danh sách
            if isinstance(data, dict):
                data = [data]

            if not isinstance(data, list):
                return Response({"error": "Expected a list, got a different type"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            violations = []

            for violation in data:
                if not isinstance(violation, dict):
                    continue

                plate_number = violation.get("plate_numbers", None)
                camera_id = violation.get("camera_id", None)
                status_text = violation.get("violation", "Unknown")
                image_url = violation.get("image", "")
                location = violation.get("location", "Unknown")
                detected_at = datetime.now()

                if not plate_number or not camera_id:
                    continue

                vehicle, _ = Vehicle.objects.get_or_create(plate_number=plate_number)
                camera, _ = Camera.objects.get_or_create(camera_id=camera_id)

                obj = Violation.objects.create(
                    plate_num=vehicle,
                    camera_id=camera,
                    status=status_text,
                    image_url=image_url,
                    location=location,
                    detected_at=detected_at
                )

                violations.append(obj)

            serialized_data = ViolationSerializer(violations, many=True).data
            print(serialized_data)
            return Response(serialized_data, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# GET: get all violations 
# POST: create new
class ViolationListCreateView(generics.ListCreateAPIView):
    queryset = Violation.objects.all()
    serializer_class = ViolationCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = ViolationSerializer(queryset, many=True)
        return Response(serializer.data)

# GET: get 1 violationviolation
# PUT/PATCH: update
# DELETE: delete
class ViolationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Violation.objects.all()
    serializer_class = ViolationCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ViolationSerializer(instance)
        return Response(serializer.data)