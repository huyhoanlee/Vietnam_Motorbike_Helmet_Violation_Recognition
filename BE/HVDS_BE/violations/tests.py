from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Violations.models import Violation, ViolationStatus  # Assuming models exist
from Citizens.models import Citizen
from CarParrots.models import CarParrots
from Vehicles.models import Vehicle
from Cameras.models import Camera, CameraUrl

User = get_user_model()

class ViolationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.citizen_user = User.objects.create_user(username="citizen", password="pass123", email="citizen@ex.com")
        self.citizen = Citizen.objects.create(citizen_identity_id="123", full_name="Test Citizen", email="citizen@ex.com")
        self.car_parrot = CarParrots.objects.create(citizen_id=self.citizen.id, plate_number="ABC123", status="Verified")
        self.vehicle = Vehicle.objects.create(car_parrot_id=self.car_parrot.id, plate_number="ABC123")
        self.camera_url = CameraUrl.objects.create(input_url="http://valid-stream.com", output_url="http://processed-stream.com")
        self.camera = Camera.objects.create(device_name="Cam1", status="Active", camera_url_id=self.camera_url.id)
        self.status = ViolationStatus.objects.create(status_name="Pending")
        self.violation = Violation.objects.create(vehicle_id=self.vehicle.id, camera_id=self.camera.id, violation_status_id=self.status.id)

    def test_get_all_violations(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_change_violation_status(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-change-status', args=[self.violation.id])
        data = {"status_name": "Confirmed"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.violation.refresh_from_db()
        self.assertEqual(self.violation.violation_status.status_name, "Confirmed")

    def test_search_violations_by_location(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-search-by-location')
        response = self.client.get(url, {"location_id": self.camera.location_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_violations_by_time(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-search-by-time')
        response = self.client.get(url, {"start_time": "2025-04-01", "end_time": "2025-04-30"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_violations_by_plate_number(self):
        self.client.force_authenticate(user=self.citizen_user)
        url = reverse('violation-search-by-plate-number')
        response = self.client.get(url, {"plate_number": "ABC123"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_generate_violation_report(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-report')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_violations_by_citizen(self):
        self.client.force_authenticate(user=self.citizen_user)
        url = reverse('violation-search-by-citizen')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_violation(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-create')
        data = {
            "vehicle_id": self.vehicle.id,
            "camera_id": self.camera.id,
            "violation_status_id": self.status.id,
            "detected_at": "2025-04-27T10:00:00Z"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Violation.objects.filter(vehicle_id=self.vehicle.id).exists())