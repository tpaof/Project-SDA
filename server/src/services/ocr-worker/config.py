import os
from dotenv import load_dotenv

load_dotenv()

# --------------------
# Redis
# --------------------
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_CHANNEL = os.getenv("REDIS_CHANNEL", "ocr:jobs")


