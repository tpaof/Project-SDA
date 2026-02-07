import os
from dotenv import load_dotenv

load_dotenv()

# --------------------
# Redis
# --------------------
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_CHANNEL = os.getenv("REDIS_CHANNEL", "ocr:jobs")

# --------------------
# Gemini AI
# --------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("⚠️ GEMINI_API_KEY not set (hybrid AI will be disabled)")
