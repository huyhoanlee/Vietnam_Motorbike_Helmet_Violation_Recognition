from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Cameras.models import Camera, CameraUrl  # Assuming Camera and CameraUrl models exist

User = get_user_model()

class CameraTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.camera_url = CameraUrl.objects.create(input_url="http://valid-stream.com", output_url="http://processed-stream.com")
        self.camera = Camera.objects.create(device_name="Cam1", status="Active", camera_url_id=self.camera_url.id)

    def test_create_camera_valid_url(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-create')
        data = {"device_name": "Cam2", "input_url": "http://valid-stream.com", "output_url": "http://processed-stream.com"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Camera.objects.filter(device_name="Cam2").exists())

    def test_create_camera_invalid_url(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-create')
        data = {"device_name": "Cam3", "input_url": "invalid-url", "output_url": "http://processed-stream.com"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_all_cameras(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-get-all')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_change_camera_status_active(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-change-status', args=[self.camera.id])
        data = {"status": "Active"}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.camera.refresh_from_db()
        self.assertEqual(self.camera.status, "Active")

    def test_change_camera_status_deactive(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-change-status', args=[self.camera.id])
        data = {"status": "Deactive"}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.camera.refresh_from_db()
        self.assertEqual(self.camera.status, "Deactive")

    def test_update_camera_details(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-update', args=[self.camera.id])
        data = {"device_name": "UpdatedCam1"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.camera.refresh_from_db()
        self.assertEqual(self.camera.device_name, "UpdatedCam1")

    def test_streaming_valid_camera(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-streaming', args=[self.camera.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("output_url", response.data)

    def test_streaming_invalid_camera(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('camera-streaming', args=[999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)