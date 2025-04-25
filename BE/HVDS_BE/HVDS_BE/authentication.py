from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser

class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY")  # Lấy API Key từ Header
        
        if not api_key or api_key != settings.API_KEY:
            raise AuthenticationFailed("Invalid or missing API Key")
        
        return (AnonymousUser(), None)