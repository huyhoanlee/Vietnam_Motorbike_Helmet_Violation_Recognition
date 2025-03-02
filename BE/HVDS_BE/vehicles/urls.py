from django.urls import path
from .views import VehicleListCreateView, VehicleDetailView

urlpatterns = [
    path('', VehicleListCreateView.as_view(), name='vehicle_list_create'),
    path('<int:pk>/', VehicleDetailView.as_view(), name='vehicle_detail'),
]
