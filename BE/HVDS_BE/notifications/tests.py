from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from notifications.models import Notification
from violations.models import Violation, ViolationStatus
from vehicles.models import Vehicle
from car_parrots.models import CarParrots
from citizens.models import Citizen
from cameras.models import Camera, CameraUrl

User = get_user_model()

class NotificationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.citizen = Citizen.objects.create(citizen_identity_id="123", full_name="Test Citizen", email="citizen@ex.com")
        self.car_parrot = CarParrots.objects.create(citizen_id=self.citizen.id, plate_number="ABC123", status="Verified")
        self.vehicle = Vehicle.objects.create(car_parrot_id=self.car_parrot.id, plate_number="ABC123")
        self.camera_url = CameraUrl.objects.create(input_url="http://valid-stream.com", output_url="http://processed-stream.com")
        self.camera = Camera.objects.create(device_name="Cam1", status="Active", camera_url_id=self.camera_url.id)
        self.status = ViolationStatus.objects.create(status_name="Pending")
        self.violation = Violation.objects.create(vehicle_id=self.vehicle.id, camera_id=self.camera.id, violation_status_id=self.status.id)
        self.notification = Notification.objects.create(violation_id=self.violation.id, status="Sent")

    def test_view_all_notifications(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('notification-view-all')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_search_notifications_by_violation(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('notification-search-by-violation')
        response = self.client.get(url, {"violation_id": self.violation.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_search_notifications_by_status(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('notification-search-by-status')
        response = self.client.get(url, {"status": "Sent"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_notification_details(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('notification-detail', args=[self.notification.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Sent")

    def test_resend_notification(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('resent', args=[self.notification.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)