# ========================
# Stage 1: Builder
# ========================
FROM python:3.10-slim as builder

# System dependencies สำหรับ build
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy requirements และ install ทั้งหมด
COPY requirements.txt .
# Use the PyTorch CPU wheel index as a fallback for CPU builds
RUN pip install --user --no-cache-dir --default-timeout=300 -r requirements.txt -f https://download.pytorch.org/whl/cpu/torch_stable.html


# ========================
# Stage 2: Runtime
# ========================
FROM python:3.10-slim

# System dependencies สำหรับ runtime เท่านั้น
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python packages จาก builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy source code
COPY . .

# -------------------------
# Environment variables
# -------------------------
ENV REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_CHANNEL=ocr:jobs \
    PYTHONUNBUFFERED=1

# -------------------------
# Expose health port
# -------------------------
EXPOSE 8080

# -------------------------
# Healthcheck
# -------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# -------------------------
# Start app
# -------------------------
CMD ["python", "app.py"]
