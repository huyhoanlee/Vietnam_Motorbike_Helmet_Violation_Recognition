import base64
import datetime
import hashlib
import hmac
import json
import sys
import threading
from urllib.parse import parse_qs

import requests
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from loguru import logger
from typing import Union

class LogAnalytics:
    workspace_id: Union[str, None]
    shared_key: Union[str, None]
    custom_table: Union[str, None]

    def __init__(self) -> None:
        self.workspace_id = "workspace ID"
        self.shared_key = ""
        self.custom_table = "CustomLogAPI"
        
    # def __init__(self) -> None:
    #     self.workspace_id = config.get("WORKSPACE-ID-LOG", "workspace ID")
    #     self.shared_key = config.get("PRIMARY-KEY-LOG", "")
    #     self.custom_table = config.get("CUSTOM-TABLE-LOG", "CustomLogAPI")
        
        
def setup_logging():
    logger.remove()
    logger.add(
        "logs/app.log",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{line} | {message}",
        rotation="5 MB",
        retention=10,
    )
    logger_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    logger.add(
        sys.stdout,
        level="DEBUG",
        colorize=True,
        format=logger_format,
        # format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{line} | {message}",
    )


# Build the API signature
def build_signature(
    customer_id, shared_key, date, content_length, method, content_type, resource
):
    x_headers = "x-ms-date:" + date
    string_to_hash = (
        method
        + "\n"
        + str(content_length)
        + "\n"
        + content_type
        + "\n"
        + x_headers
        + "\n"
        + resource
    )
    bytes_to_hash = bytes(string_to_hash, encoding="utf-8")
    decoded_key = base64.b64decode(shared_key)
    encoded_hash = base64.b64encode(
        hmac.new(decoded_key, bytes_to_hash, digestmod=hashlib.sha256).digest()
    ).decode()
    authorization = "SharedKey {}:{}".format(customer_id, encoded_hash)
    return authorization


# Build and send a request to the POST API
def send_log_analystic(body):
    log_analystics = LogAnalytics()
    customer_id = log_analystics.workspace_id
    shared_key = log_analystics.shared_key
    log_type = log_analystics.custom_table
    method = "POST"
    content_type = "application/json"
    resource = "/api/logs"
    rfc1123date = datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")
    content_length = len(body)
    signature = build_signature(
        customer_id,
        shared_key,
        rfc1123date,
        content_length,
        method,
        content_type,
        resource,
    )
    uri = (
        "https://"
        + customer_id
        + ".ods.opinsights.azure.com"
        + resource
        + "?api-version=2016-04-01"
    )

    headers = {
        "content-type": content_type,
        "Authorization": signature,
        "Log-Type": log_type,
        "x-ms-date": rfc1123date,
    }
    response = requests.post(url=uri, headers=headers, data=body, timeout=10)
    return response


async def log_request_info(request: Request):
    request_body = {}
    try:
        request_body = await request.json()
    except Exception as e:
        request_body = {}
    body = jsonable_encoder(request_body)
    query_param = parse_qs(str(request.query_params))
    logger.info(
        f"{request.method} request to {request.url} Headers: {request.headers} Body: {body} Path Params: {request.path_params} Query Params: {query_param} Cookies: {request.cookies}"
    )
    log_analystic = [
        {
            "url": request.url._url,
            "method": request.method,
            "headers": str(jsonable_encoder(request.headers)),
            "body": str(body),
            "path": request.path_params,
            "query": query_param,
            "cookies": str(request.cookies),
            "user_id": (
                request.state.user_id if hasattr(request.state, "user_id") else ""
            ),
        }
    ]
    thread = threading.Thread(
        target=send_log_analystic, args=(json.dumps(log_analystic, ensure_ascii=False),)
    )
    thread.start()  # Start the thread to execute
