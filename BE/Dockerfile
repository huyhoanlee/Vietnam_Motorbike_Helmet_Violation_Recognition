FROM python:3.10

RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY --chown=user . /app

WORKDIR /app/HVDS_BE

RUN python manage.py migrate
RUN python manage.py generate_location_data
RUN python manage.py generate_violation_status_data
RUN python manage.py generate_camera_data
RUN python manage.py generate_account_data

CMD ["uvicorn", "HVDS_BE.asgi:application", "--host", "0.0.0.0", "--port", "7860"]
# uvicorn HVDS_BE.asgi:application --host 0.0.0.0 --port 7860