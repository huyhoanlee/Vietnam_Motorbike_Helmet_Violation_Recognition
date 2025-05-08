from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin", password="admin123", email="admin@ex.com")
        self.user = User.objects.create_user(username="user1", password="pass123", email="user@ex.com")
        self.deactive_user = User.objects.create_user(username="deactive", password="pass123", email="deactive@ex.com", status="Deactive")

    def test_login_active_account(self):
        url = reverse('token_obtain_pair')
        data = {"username": "user1", "password": "pass123"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_login_deactive_account(self):
        url = reverse('token_obtain_pair')
        data = {"username": "deactive", "password": "pass123"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_register_by_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('register')
        data = {"username": "newuser", "password": "pass123", "email": "new@ex.com"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_by_non_admin(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('register')
        data = {"username": "newuser", "password": "pass123", "email": "new@ex.com"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_all_accounts(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('account-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_account_status_by_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('account-status-update', args=[self.user.id])
        data = {"status": "Deactive"}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_profile(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('account-update', args=[self.user.id])
        data = {"email": "new@ex.com"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_view_profile(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('account-profile', args=[self.user.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_refresh_token(self):
        login_url = reverse('token_obtain_pair')
        response = self.client.post(login_url, {"username": "user1", "password": "pass123"})
        refresh_token = response.data["refresh"]
        url = reverse('refresh_token')
        response = self.client.post(url, {"refresh": refresh_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)