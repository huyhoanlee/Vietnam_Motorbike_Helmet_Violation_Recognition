from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from notifications.models import Notification
from .models import Mail
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

class ReplyMailView(APIView):
    def get_queryset(self):
        notification_id = self.request.query_params.get('notification_id')
        notification = Notification.objects.get(notification_id)
        mail = Mail.objects.filter(notification_id=notification)
        message = self.request.query_params.get('message')
        
        subject = f"Reply to {mail[-1].id}"
        to_email = [mail[-1].to_email]
        send_mail(subject, message, settings.EMAIL_HOST_USER, to_email)
        new_mail = Mail.objects.create(
            message=message,
            to_email=to_email,
            notification_id=notification,
            created_at=timezone.now()
        )
        return new_mail
        
    def put(self, request):
        queryset = self.get_queryset()
        return Response({
            "message": "Reply email successfully",
            "data" : {"mail_id": queryset.id, 
            "email": queryset.to_email,
            "message": queryset.message,
            "time": queryset.created_at
            }}, status=status.HTTP_200_OK
        )

class SendMailView(APIView):
    def post(self, request):
        address = "hanaxuan1study@gmail.com"
        subject = "4AI1SE"
        message = "testing"

        try:
            send_mail(subject, message, settings.EMAIL_HOST_USER, [address])
            return Response({"message": "Email sent successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": f"Error sending email: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@ensure_csrf_cookie
def get_csrf_token(request):
    return HttpResponse(status=200)