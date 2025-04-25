from .views import CreateView, ListView, CityListView, DistrictListView, RoadListView
from django.urls import path

urlpatterns = [
    path('get-all/', ListView.as_view(), name='location-get-all'),
    path('create/', CreateView.as_view(), name='location-create'),
    path('cities/', CityListView.as_view(), name='city-list'),
    path('districts/', DistrictListView.as_view(), name='district-list'),
    path('roads/', RoadListView.as_view(), name='road-list'),
]
