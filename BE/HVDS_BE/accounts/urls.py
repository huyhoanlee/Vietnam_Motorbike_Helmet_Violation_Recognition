from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RoleViewSet, LogoutView
from .views import RegisterView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('logout/', LogoutView.as_view({'post': 'create'}), name='logout'),
    path("register/", RegisterView.as_view(), name="register"),
]
