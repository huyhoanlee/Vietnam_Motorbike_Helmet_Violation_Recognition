from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from locations.models import Location 

User = get_user_model()

class LocationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.location = Location.objects.create(name="Test Location", road="Main St", dist="District 1", city="Hanoi")

    def test_get_all_locations(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('location-get-all')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_location(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('location-create')
        data = {"name": "New Location", "road": "Second St", "dist": "District 2", "city": "HCMC"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Location.objects.filter(name="New Location").exists())

    def test_get_all_cities(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('city-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Hanoi", [item["city"] for item in response.data])

    def test_get_all_districts(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('district-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("District 1", [item["dist"] for item in response.data])

    def test_get_all_roads(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('road-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Main St", [item["road"] for item in response.data])