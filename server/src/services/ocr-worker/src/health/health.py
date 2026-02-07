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


def check_tesseract():
    try:
        result = subprocess.run(
            ["tesseract", "--version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=3
        )
        return result.returncode == 0, None
    except Exception as e:
        return False, str(e)


def get_health_status():
    redis_ok, redis_err = check_redis()
    tess_ok, tess_err = check_tesseract()

    status = "ok" if redis_ok and tess_ok else "degraded"

    return {
        "status": status,
        "redis": {
            "ok": redis_ok,
            "error": redis_err
        },
        "tesseract": {
            "ok": tess_ok,
            "error": tess_err
        }
    }
