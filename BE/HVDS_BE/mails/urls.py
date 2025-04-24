from django.urls import path
from django.contrib import admin
from .views import SendMailView, get_csrf_token, ReplyMailView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('sent/', SendMailView.as_view()),
    path('get-csrf/', get_csrf_token, name='get-csrf'),
    path('reply/', ReplyMailView.as_view()),
]
