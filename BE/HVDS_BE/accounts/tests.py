# from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

User = get_user_model()

class AccountsAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'Testpass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        self.admin_data = {
            'username': 'admin',
            'email': 'admin@example.com',
            'password': 'Adminpass123!',
            'is_staff': True
        }
        self.user = User.objects.create_user(**self.user_data)
        self.admin = User.objects.create_superuser(**self.admin_data)

    def test_register_success(self):
        """Test registering a new user."""
        url = reverse('register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'Newpass123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 3)  # Existing user + admin + new user
        self.assertEqual(response.data['email'], data['email'])

    def test_register_duplicate_email(self):
        """Test registering with an existing email."""
        url = reverse('register')
        data = {
            'username': 'anotheruser',
            'email': 'testuser@example.com',  # Duplicate email
            'password': 'Anotherpass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_login_success(self):
        """Test logging in with valid credentials."""
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'Testpass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_credentials(self):
        """Test logging in with invalid credentials."""
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'Wrongpass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)

    def test_refresh_token_success(self):
        """Test refreshing an access token."""
        refresh = RefreshToken.for_user(self.user)
        url = reverse('refresh_token')
        data = {'refresh': str(refresh)}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_token_invalid(self):
        """Test refreshing with an invalid token."""
        url = reverse('refresh_token')
        data = {'refresh': 'invalid_token'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)

    def test_logout_success(self):
        """Test logging out with a valid refresh token."""
        refresh = RefreshToken.for_user(self.user)
        url = reverse('logout')
        self.client.force_authenticate(user=self.user)
        data = {'refresh': str(refresh)}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify token is blacklisted (implementation-dependent)

    def test_logout_unauthenticated(self):
        """Test logging out without authentication."""
        url = reverse('logout')
        data = {'refresh': 'some_token'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_all_accounts_admin(self):
        """Test getting all accounts as admin."""
        url = reverse('account-list')
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # User + Admin

    # def test_get_all_accounts_non_admin(self):
    #     """Test getting all accounts as non-admin."""
    #     url = reverse('account-list')
    #     self.client.force_authenticate(user=self.user)
    #     response = self.client.get(url, format='json')
    #     self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_account_status_admin(self):
        """Test updating account status as admin."""
        url = reverse('account-status-update', kwargs={'id': self.user.id})
        self.client.force_authenticate(user=self.admin)
        data = {'status': 'inactive'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'inactive')

    # def test_update_account_status_non_admin(self):
    #     """Test updating account status as non-admin."""
    #     url = reverse('account-status-update', kwargs={'id': self.user.id})
    #     self.client.force_authenticate(user=self.user)
    #     data = {'status': 'inactive'}
    #     response = self.client.patch(url, data, format='json')
    #     self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_account_success(self):
        """Test updating own account details."""
        url = reverse('account-update', kwargs={'id': self.user.id})
        self.client.force_authenticate(user=self.user)
        data = {'first_name': 'Updated', 'email': 'updated@example.com'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.email, 'updated@example.com')

    # def test_update_account_other_user(self):
    #     """Test updating another user's account."""
    #     url = reverse('account-update', kwargs={'id': self.admin.id})
    #     self.client.force_authenticate(user=self.user)
    #     data = {'first_name': 'Hacked'}
    #     response = self.client.patch(url, data, format='json')
    #     self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_profile_success(self):
        """Test getting own profile."""
        url = reverse('account-profile', kwargs={'id': self.user.id})
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    # def test_get_profile_other_user(self):
    #     """Test getting another user's profile."""
    #     url = reverse('account-profile', kwargs={'id': self.admin.id})
    #     self.client.force_authenticate(user=self.user)
    #     response = self.client.get(url, format='json')
    #     self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)