from django.urls import path
from .views import NotificationViewAllView, NotificationSearchByViolationView, NotificationSearchByStatusView, NotificationDetailView

urlpatterns = [
    path('view_all/', NotificationViewAllView.as_view(), name='notification-view-all'),
    path('search-by-violation/', NotificationSearchByViolationView.as_view(), name='notification-search-by-violation'),
    path('search-by-status/', NotificationSearchByStatusView.as_view(), name='notification-search-by-status'),
    path('<int:id>/', NotificationDetailView.as_view(), name='notification-detail'),
    path('re-sent/<int:id>', NotificationSearchByStatusView.as_view(), name='resent'),
    
]
