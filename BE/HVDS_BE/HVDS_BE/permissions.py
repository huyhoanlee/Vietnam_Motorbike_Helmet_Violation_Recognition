from rest_framework.permissions import BasePermission
from django.conf import settings

class IsAdminOrAPIKeyAuthenticated(BasePermission):

    def has_permission(self, request, view):
        if request.user and request.user.is_staff:
            return True

        api_key = request.headers.get("X-API-KEY")
        if api_key and api_key == settings.API_KEY:
            return True

        return False
