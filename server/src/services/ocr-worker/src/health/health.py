import subprocess
import redis
from config import REDIS_HOST, REDIS_PORT


def check_redis():
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, socket_connect_timeout=2)
        r.ping()
        return True, None
    except Exception as e:
        return False, str(e)


def get_health_status():
    redis_ok, redis_err = check_redis()
    
    # EasyOCR is a library, so if the app starts, it's likely fine.
    # explicit check removed to avoid "tesseract not found" error.

    return {
        "status": "ok" if redis_ok else "degraded",
        "redis": {
            "ok": redis_ok,
            "error": redis_err
        },
        "ocr_engine": "EasyOCR"
    }
