from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RoleViewSet, LogoutView, AccountListView, AccountStatusUpdateView, AccountUpdateView, CustomTokenObtainPairView, RefreshTokenView, AccountProfileView
from .views import RegisterView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    path('get-all/', AccountListView.as_view(), name='account-list'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', LogoutView.as_view({'post': 'create'}), name='logout'),
    path("register/", RegisterView.as_view(), name="register"),
    path('status/<int:id>/', AccountStatusUpdateView.as_view(), name='account-status-update'),
    path('update/<int:id>/', AccountUpdateView.as_view(), name='account-update'),
    path('profile/<int:id>/', AccountProfileView.as_view(), name='account-profile'),
    path('', include(router.urls)),
]
