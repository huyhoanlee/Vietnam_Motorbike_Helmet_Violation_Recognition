from django.urls import path
from .views import CreateView, ListView, CameraChangeStatusView, CameraUpdateView, StreamingView

urlpatterns = [
    path('create/', CreateView.as_view(), name='camera-create'),
    path('get-all/', ListView.as_view(), name='camera-get-all'),
    path('change-status/<int:id>/', CameraChangeStatusView.as_view(), name='camera-change-status'),
    path('update/<int:id>/', CameraUpdateView.as_view(), name='camera-update'),
    path('streaming/<int:id>/', StreamingView.as_view(), name='camera-streaming'),
]
