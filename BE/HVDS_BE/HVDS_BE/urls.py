"""
URL configuration for HVDS_BE project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
urlpatterns = [
    path("admin/", admin.site.urls),
    # path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/cameras/', include('cameras.urls')),
    path('api/violations/', include('violations.urls')),
    path('api/vehicles/', include('vehicles.urls')),
    path('api/notifications/', include('notifications.urls')),
    # path('api/camera_urls/', include('camera_urls.urls')),
    path('api/car_parrots/', include('car_parrots.urls')),
    path('api/citizens/', include('citizens.urls')),
    path('api/locations/', include('locations.urls')),
    path('api/mails/', include('mails.urls')),
    # path('api/violation_images/', include('violation_images.urls')),
    path('api/violation_status/', include('violation_status.urls')),
]
