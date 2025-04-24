import jwt
import time
import requests
from django.conf import settings

def get_access_token(exp):
    now = int(time.time())
    header = {"cty": "stringee-api;v=1"}
    payload = {
        "jti": f"{settings.STRINGEE_KEY_SID}-{now}",
        "iss": settings.STRINGEE_KEY_SID,
        "exp": exp,
        "rest_api": 1
    }

    token = jwt.encode(payload, settings.STRINGEE_KEY_SECRET, algorithm="HS256", headers=header)
    return token

def call_api(to_number: str, exp, code_authen):
    to_number = f'84{to_number[1:]}'
    data = {
        "from": {
            "type": "external",
            "number": settings.STRINGEE_FROM_NUMBER,
            "alias": settings.STRINGEE_FROM_NUMBER
        },
        "to": [
            {
                "type": "external",
                "number": to_number,
                "alias": to_number
            }
        ],
        "actions": [
            {
                "action": "talk",
                "text": f'Mã xác thực của bạn là {str(",".join(code_authen))}. Vui lòng nhập mã xác thực.',
                "speed": -1
            }
        ]
    }
    headers = {
        "X-STRINGEE-AUTH": get_access_token(exp),
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    try:
        response = requests.post(settings.STRINGEE_URL, json=data, headers=headers, timeout=15)
        return response.status_code

    except Exception as e:
        return e