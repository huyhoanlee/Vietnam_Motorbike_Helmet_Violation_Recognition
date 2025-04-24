from .views import CreateView, ListView, ViolationStatusChangeView, ViolationStatusDeleteView
from django.urls import path

urlpatterns = [
    path('change-status/<int:id>/', ViolationStatusChangeView.as_view(), name='violation-status-change'),
    path('delete/<int:id>/', ViolationStatusDeleteView.as_view(), name='violation-status-delete'),
    path('get-all/', ListView.as_view(), name='violation-status-get-all'),
    path('create/', CreateView.as_view(), name='violation-status-create'),
]
