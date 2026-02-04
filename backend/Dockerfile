FROM python:3.12-slim

# Install system dependencies (ffmpeg for pydub, libmagic for python-magic)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD python manage.py migrate && gunicorn core.wsgi --bind 0.0.0.0:$PORT
