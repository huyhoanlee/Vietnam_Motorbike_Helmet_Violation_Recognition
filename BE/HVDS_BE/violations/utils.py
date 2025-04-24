from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from notifications.models import Notification
from violation_images.models import ViolationImages
from mails.models import Mail
from django.utils import timezone

def post_process_change_status(violation):
    car_parrot = violation.vehicle_id.car_parrot_id
    exist_notification = Notification.objects.filter(violation_id=violation).exists()
    if (car_parrot and car_parrot.status == 'Verified' and not exist_notification):
        to_email = car_parrot.citizen_id.email
        subject = 'Violation Notification'
        # message = f'''
        #     Dear {car_parrot.citizen_id.full_name},\n\n
        #     A verified violation has been recorded for your vehicle (Plate: {car_parrot.plate_number}).\n
        #     Detected At: {violation.detected_at.strftime('%Y-%m-%d %H:%M:%S')}\n
        #     Please address this matter promptly.\n\n
        #     Best regards,\n4AI1SE Team
        #     '''
        # send_mail(subject, message, settings.EMAIL_HOST_USER, [to_email])
        violation_images = ViolationImages.objects.filter(violation_id=violation).order_by('-confidence')[:3]
        plain_message = f'''
            Dear {car_parrot.citizen_id.full_name},\n\n
            A verified violation has been recorded for your vehicle (Plate: {car_parrot.plate_number}).\n
            Violation ID: {violation.id}\n
            Detected At: {violation.detected_at.strftime('%Y-%m-%d %H:%M:%S')}\n
            Violation Images: Please view this email in an HTML-capable email client to see images.\n
            Please address this matter promptly.\n\n
            Best regards,\n4AI1SE Team
        '''
        image_tags = ''.join([
            f'<p><img src="data:image/jpeg;base64,{img.image}" alt="Violation Image" style="max-width: 600px;"></p>'
            for img in violation_images
        ]) if violation_images else '<p>No images available.</p>'
        message = f'''
            <html>
            <body>
                <p>Dear {car_parrot.citizen_id.full_name},</p>
                <p>A verified violation has been recorded for your vehicle (Plate: {car_parrot.plate_number}).</p>
                <p><strong>Violation ID:</strong> {violation.id}</p>
                <p><strong>Detected At:</strong> {violation.detected_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
                <h3>Violation Images:</h3>
                {image_tags}
                <p>Please address this matter promptly.</p>
                <p>Best regards,<br>4AI1SE Team</p>
            </body>
            </html>
        '''
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            to=[to_email],
            # reply_to=['support@hvds.com']
        )
        email.attach_alternative(message, 'text/html')
        email.send()
        notification = Notification.objects.create(
            status='Sent',
            created_at=timezone.now(),
            violation_id=violation
        )
        mail = Mail.objects.create(
            message = message,
            created_at=timezone.now(),
            to_email = to_email,
            notification_id = notification
        )
        