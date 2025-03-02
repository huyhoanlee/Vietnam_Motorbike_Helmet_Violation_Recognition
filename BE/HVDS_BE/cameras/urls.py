from django.urls import path
from .views import ExternalCameraDetailView

urlpatterns = [
    path('external/<str:camera_id>/', ExternalCameraDetailView.as_view(), name='external-camera-detail'),
]
