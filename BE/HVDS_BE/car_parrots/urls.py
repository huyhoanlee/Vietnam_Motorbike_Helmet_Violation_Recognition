# carparrots/urls.py
from django.urls import path
from .views import CarParrotsListView, CarParrotsVerifyView, CarParrotsDetailView, CarParrotUpdateView

urlpatterns = [
    path('get-all/', CarParrotsListView.as_view(), name='carparrots-list'),
    path('verified/<int:id>/', CarParrotsVerifyView.as_view(), name='carparrots-verify'),
    path('information/<int:id>/', CarParrotsDetailView.as_view(), name='carparrots-detail'),
    path('update/<int:id>/', CarParrotUpdateView.as_view(), name='car-parrot-update'),
]