from django.urls import path
from .views import ExternalCameraDetailView, CameraListCreateView, CameraRetrieveUpdateDestroyView

urlpatterns = [
    path('external/<str:camera_id>/', ExternalCameraDetailView.as_view(), name='external-camera-detail'),
    path('', CameraListCreateView.as_view(), name='camera-list-create'),
    path('<int:pk>/', CameraRetrieveUpdateDestroyView.as_view(), name='camera-detail'),
]
