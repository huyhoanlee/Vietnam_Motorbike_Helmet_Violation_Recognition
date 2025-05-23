from django.urls import path
from .views import *

urlpatterns = [
    path('get-all-submitted/', CitizenGetAllSubmittedView.as_view(), name='citizen-get-all-submitted'),
    path('get-all/', CitizenGetAllView.as_view(), name='citizen-get-all'),
    path('verify/<int:id>/', CitizenVerifyView.as_view(), name='citizen-verify'),
    path('reject/<int:id>/', CitizenRejectView.as_view(), name='citizen-reject'),
    path('register-car-parrot/<int:id>/', CarParrotRegisterView.as_view(), name='register-car-parrot'),
    path('get-applications/<int:id>/', CitizenApplicationsView.as_view(), name='citizen-applications'),
    path('auth/', CitizenAuthView.as_view(), name='citizen-auth'),
    path('update-info/<int:id>/', CitizenUpdateView.as_view(), name='citizen-update-info'),
    path('information/<int:id>/', CitizenInformationView.as_view(), name='citizen-info'),
    path('change-email/<int:id>/', CitizenChangeEmailView.as_view(), name='citizen-change-email'),
    path('check-car-parrot/', CitizenCheckCarParrotView.as_view(), name='citizen-check-email'),
    path('count-by-status/', CitizenCountByStatusView.as_view(), name='citizen-count-by-status'),
]