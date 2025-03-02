from django.urls import path
from .views import GenerateNotificationsView

urlpatterns = [
    path('generate/', GenerateNotificationsView.as_view(), name='generate_notifications'),
]
