import requests
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from violations.models import Violation
from vehicles.models import Vehicle
from .serializers import NotificationSerializer  # Đảm bảo import serializer

class GenerateNotificationsView(APIView):
    def get(self, request):
        violations_api_url = "http://127.0.0.1:8000/api/violations/ai-detect/"

        try:
            response = requests.get(violations_api_url, timeout=5)
            if response.status_code == 200:
                violations_data = response.json()
                notifications = []

                for violation in violations_data:
                    plate_number = violation["plate_num"]

                    # Đếm số vi phạm của xe này
                    violation_count = Violation.objects.filter(plate_num__plate_number=plate_number).count()

                    # Chỉ gửi Notification nếu có >=1 vi phạm
                    if violation_count > 0:
                        vehicle = Vehicle.objects.get(plate_number=plate_number)

                        # Lấy vi phạm gần nhất
                        latest_violation = Violation.objects.filter(plate_num=vehicle).latest('detected_at')

                        # Lưu Notification vào DB
                        notification = Notification.objects.create(
                            plate_num=vehicle,
                            status=f"{violation_count} violations detected",
                            image_url=latest_violation.image_url,
                            location=latest_violation.location
                        )

                        notifications.append(notification)

                # Serialize dữ liệu
                serialized_data = NotificationSerializer(notifications, many=True).data

                return Response(serialized_data, status=status.HTTP_200_OK)

            return Response({"error": "Failed to fetch violations"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
