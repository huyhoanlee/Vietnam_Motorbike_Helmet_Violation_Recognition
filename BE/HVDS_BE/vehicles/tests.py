from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Vehicles.models import Vehicle  # Assuming Vehicle model exists
from Citizens.models import Citizen
from CarParrots.models import CarParrots

User = get_user_model()

class VehicleTests(APITestCase):
    def setUp(self):
        self.citizen_user = User.objects.create_user(username="citizen", password="pass123", email="citizen@ex.com")
        self.citizen = Citizen.objects.create(citizen_identity_id="123", full_name="Test Citizen", email="citizen@ex.com")
        self.car_parrot = CarParrots.objects.create(citizen_id=self.citizen.id, plate_number="ABC123", status="Verified")
        self.vehicle = Vehicle.objects.create(car_parrot_id=self.car_parrot.id, plate_number="ABC123")

    def test_search_vehicles_by_citizen(self):
        self.client.force_authenticate(user=self.citizen_user)
        url = reverse('vehicle-search-by-citizen')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["plate_number"], "ABC123")