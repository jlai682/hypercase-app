FROM python:3.12-slim

# Install system dependencies
# - ffmpeg: required by pydub for audio format conversion
# - libmagic1: required by python-magic for file type detection
# - build-essential cmake: required to compile praat-parselmouth from source
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libmagic1 \
    build-essential \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Collect static files at build time (SECRET_KEY may not exist yet, so allow failure)
RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["gunicorn", "core.wsgi", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "--timeout", "120"]
