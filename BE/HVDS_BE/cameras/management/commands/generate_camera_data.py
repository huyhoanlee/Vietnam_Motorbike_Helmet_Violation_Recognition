import pandas as pd
import requests
from django.core.management.base import BaseCommand
from cameras.models import Camera, CameraUrl
from django.conf import settings

class Command(BaseCommand):
    help = 'Generate camera data from Excel file or sample data and send to API'

    def get_auth_token(self):
        """Lấy token xác thực từ API đăng nhập"""
        login_data = {
            "username": "admin",
            "password": "123"
        }
        try:
            response = requests.post(settings.LOGIN_URL, json=login_data)
            if response.status_code == 200:
                token = response.json().get("access")
                return token
            else:
                self.stdout.write(self.style.ERROR(f"Failed to authenticate: {response.status_code} - {response.text}"))
                return None
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Error during authentication: {str(e)}"))
            return None

    def handle(self, *args, **kwargs):
        token = self.get_auth_token()
        if not token:
            self.stdout.write(self.style.ERROR("Cannot proceed without authentication token"))
            return

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        df = pd.read_excel(settings.FILE_DATA_PATH, sheet_name='Camera')
        Camera.objects.all().delete()
        CameraUrl.objects.all().delete()

        for index, row in df.iterrows():
            camera_data = {
                "url_input": str(row['url_input']),
                "location_id": str(row['location_id']),
                "device_name": str(row['device_name']),
                "status": str(row['status'])
            }
            try:
                response = requests.post(settings.CREATE_CAMERA_url, json=camera_data, headers=headers)
                if response.status_code == 201:
                    self.stdout.write(self.style.SUCCESS(f"Created camera: {camera_data['device_name']}"))
                else:
                    self.stdout.write(self.style.ERROR(
                        f"Failed to create camera {camera_data['device_name']}: {response.status_code} - {response.text}"
                    ))
            except requests.RequestException as e:
                self.stdout.write(self.style.ERROR(f"Error sending request for {camera_data['device_name']}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Processed {len(df)} cameras from Excel"))