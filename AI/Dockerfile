FROM python:3.11.11-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    ffmpeg \
    wget \
    git \
    curl \
    python3-pip \
    && pip install --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

# Install virtualenv globally
RUN pip install virtualenv

# Create and activate a virtual environment
RUN virtualenv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements file first (for cache)
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy all source code to container
COPY . .

# Expose port to access app from outside
EXPOSE 8000

# Run the app with uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]