# violations/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('get-all/', ViolationListView.as_view(), name='violation-list'),
    path('change-status/<int:id>/', ViolationChangeStatusView.as_view(), name='violation-change-status'),
    path('search-by-location/', ViolationSearchByLocationView.as_view(), name='violation-search-by-location'),
    path('search-by-time/', ViolationSearchByTimeView.as_view(), name='violation-search-by-time'),
    path('search-by-plate-number/', ViolationSearchByPlateNumberView.as_view(), name='violation-search-by-plate-number'),
    path('report/', ViolationReportView.as_view(), name='violation-report'),
    path('report/<int:id>/', ViolationGetReportView.as_view(), name='violation-report-get'),
    path('search-by-citizen/', ViolationSearchByCitizenView.as_view(), name='violation-search-by-citizen'),
    path('create/', ViolationCreateView.as_view(), name='violation-create'),
    path('count-by-status/', ViolationCountByStatusView.as_view(), name='violation-count-by-status'),
    path('count-all/', ViolationCountAllView.as_view(), name='violation-count-all'),
    path('count-by-location/', ViolationCountByLocationView.as_view(), name='violation-count-location'),
    path('count-by-time/', ViolationCountByTimeView.as_view(), name='violation-count-time'),
]