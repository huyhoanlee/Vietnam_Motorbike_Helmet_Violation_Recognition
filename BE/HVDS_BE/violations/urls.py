from django.urls import path
from .views import AIViolationDetectionView, ViolationListCreateView, ViolationRetrieveUpdateDestroyView

urlpatterns = [
    path('ai-detect/', AIViolationDetectionView.as_view(), name='ai_violation_detect'),
    path('', ViolationListCreateView.as_view(), name='violation-list-create'),
    path('<int:pk>/', ViolationRetrieveUpdateDestroyView.as_view(), name='violation-detail'),
]
