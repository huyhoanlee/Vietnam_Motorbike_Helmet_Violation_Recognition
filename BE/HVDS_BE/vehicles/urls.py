from django.urls import path
from .views import VehicleListCreateView, VehicleUpdateView, VehicleSearchByCitizenView

urlpatterns = [
    path('search-by-citizen/', VehicleSearchByCitizenView.as_view(), name='vehicle-search-by-citizen'),
    path('<str:pk>/', VehicleUpdateView.as_view(), name='vehicle_detail'),
    path('', VehicleListCreateView.as_view(), name='vehicle_list_create'),
]
