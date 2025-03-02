from django.urls import path
from .views import AIViolationDetectionView

urlpatterns = [
    path('ai-detect/', AIViolationDetectionView.as_view(), name='ai_violation_detect'),
]
