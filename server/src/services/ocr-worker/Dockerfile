# -------------------------
# Base Image
# -------------------------
FROM python:3.10-slim

# -------------------------
# System dependencies
# -------------------------
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-tha \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# -------------------------
# Workdir
# -------------------------
WORKDIR /app

# -------------------------
# Python dependencies
# -------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -------------------------
# Copy source code
# -------------------------
COPY . .

# -------------------------
# Environment variables
# -------------------------
ENV REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_CHANNEL=ocr:jobs

ENV PYTHONUNBUFFERED=1
ENV TESSERACT_CMD=/usr/bin/tesseract

# -------------------------
# Expose health port
# -------------------------
EXPOSE 8080

# -------------------------
# Healthcheck (optional แต่แนะนำมาก)
# -------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# -------------------------
# Start app
# -------------------------
CMD ["python", "app.py"]
