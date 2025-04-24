import requests
from django.conf import settings

def send_sms(phone_number, message, sms_type='2', sender='SpeedSMS'):
    """
    Send SMS using SpeedSMS API.
    :param phone_number: Recipient's phone number (e.g., '84912345678')
    :param message: SMS content
    :param sms_type: '2' (marketing) or '4' (transactional)
    :param sender: Brand name (approved by SpeedSMS)
    :return: Response from API
    """
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {settings.SPEEDSMS_ACCESS_TOKEN}'
    }
    payload = {
        'to': phone_number,
        'content': message,
        'sms_type': sms_type,
        'sender': sender
    }
    try:
        response = requests.post(settings.SPEEDSMS_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        return {'status': 'error', 'message': str(e)}