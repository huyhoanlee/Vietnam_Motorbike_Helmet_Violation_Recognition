# from django.conf import settings
# from twilio.rest import Client

# class MessageHandler:
#     def __init__(self, phone_number, otp):
#         self.phone_number = phone_number
#         self.otp = otp

#     def send_otp_via_message(self):
#         client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
#         message = client.messages.create(
#             body=f'Your OTP is: {self.otp}',
#             from_=settings.TWILIO_PHONE_NUMBER,
#             to=f'{settings.COUNTRY_CODE}{self.phone_number}'
#         )