from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Citizens.models import Citizen, CarParrots  # Assuming models exist

User = get_user_model()

class CitizenTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.citizen = Citizen.objects.create(citizen_identity_id="123", full_name="Test Citizen", email="citizen@ex.com", status="Submitted")
        self.car_parrot = CarParrots.objects.create(citizen_id=self.citizen.id, plate_number="ABC123", status="Submitted")

    def test_get_all_submitted_citizens(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('citizen-get-all-submitted')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_all_citizens(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('citizen-get-all')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_citizen(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('citizen-verify', args=[self.citizen.id])
        data = {"status": "Verified"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.status, "Verified")

    def test_register_car_parrot(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('register-car-parrot', args=[self.citizen.id])
        data = {"plate_number": "XYZ789", "status": "Submitted"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CarParrots.objects.filter(plate_number="XYZ789").exists())

    def test_get_citizen_applications(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('citizen-applications', args=[self.citizen.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_citizen_authentication(self):
        url = reverse('citizen-auth')
        data = {"citizen_identity_id": "123", "otp": "123456"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_citizen_info(self):
        self.client.force_authenticate(user=self.citizen)
        url = reverse('citizen-update-info', args=[self.citizen.id])
        data = {"full_name": "Updated Citizen"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.full_name, "Updated Citizen")

    def test_get_citizen_information(self):
        self.client.force_authenticate(user=self.citizen)
        url = reverse('citizen-info', args=[self.citizen.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_citizen_email(self):
        self.client.force_authenticate(user=self.citizen)
        url = reverse('citizen-change-email', args=[self.citizen.id])
        data = {"email": "new@ex.com"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.email, "new@ex.com")

    def test_check_car_parrot(self):
        self.client.force_authenticate(user=self.citizen)
        url = reverse('citizen-check-email')
        data = {"plate_number": "ABC123"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)