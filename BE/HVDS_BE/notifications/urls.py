from django.urls import path
from .views import GenerateNotificationsView, NotificationListCreateView, NotificationRetrieveUpdateDestroyView

urlpatterns = [
    path('generate/', GenerateNotificationsView.as_view(), name='generate_notifications'),
    path('', NotificationListCreateView.as_view(), name='violation-list-create'),
    path('<int:pk>/', NotificationRetrieveUpdateDestroyView.as_view(), name='violation-detail'),
]
