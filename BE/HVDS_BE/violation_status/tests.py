from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from ViolationStatus.models import ViolationStatus  # Assuming ViolationStatus model exists

User = get_user_model()

class ViolationStatusTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.status = ViolationStatus.objects.create(status_name="Pending", description="Initial status")

    def test_change_violation_status(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-status-change', args=[self.status.id])
        data = {"status_name": "Confirmed", "description": "Updated status"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTML_200_OK)
        self.status.refresh_from_db()
        self.assertEqual(self.status.status_name, "Confirmed")

    def test_delete_violation_status(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-status-delete', args=[self.status.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ViolationStatus.objects.filter(id=self.status.id).exists())

    def test_get_all_violation_statuses(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-status-get-all')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_violation_status(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('violation-status-create')
        data = {"status_name": "Resolved", "description": "Violation resolved"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ViolationStatus.objects.filter(status_name="Resolved").exists())