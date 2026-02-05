import os
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = "host.docker.internal"
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_CHANNEL = "ocr:jobs"

TESSERACT_CMD = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")