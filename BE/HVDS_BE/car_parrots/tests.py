from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from CarParrots.models import CarParrots  # Assuming CarParrots model exists
from Citizens.models import Citizen

User = get_user_model()

class CarParrotsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.citizen = Citizen.objects.create(citizen_identity_id="123", full_name="Test Citizen", email="citizen@ex.com")
        self.car_parrot = CarParrots.objects.create(citizen_id=self.citizen.id, plate_number="ABC123", status="Submitted")

    def test_get_all_car_parrots(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('carparrots-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_car_parrot(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('carparrots-verify', args=[self.car_parrot.id])
        data = {"status": "Verified"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.car_parrot.refresh_from_db()
        self.assertEqual(self.car_parrot.status, "Verified")

    def test_get_car_parrot_details(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('carparrots-detail', args=[self.car_parrot.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["plate_number"], "ABC123")

    def test_update_car_parrot(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('car-parrot-update', args=[self.car_parrot.id])
        data = {"plate_number": "XYZ789"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.car_parrot.refresh_from_db()
        self.assertEqual(self.car_parrot.plate_number, "XYZ789")