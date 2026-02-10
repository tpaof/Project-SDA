import json
import redis
import traceback
import time
import cv2

from config import REDIS_HOST, REDIS_PORT, REDIS_CHANNEL

from src.preprocessing.image import preprocess_image
from src.ocr.extractor import extract_text_with_log
from src.parser.slip_parser import parse_bill_slip
from src.callback.notify import send_ocr_result
from src.utils.logger import log_ocr_result

# Reconnection config
MAX_RECONNECT_DELAY = 30  # seconds
INITIAL_RECONNECT_DELAY = 2  # seconds


def _process_job(message):
    """Process a single OCR job from Redis. Returns (job_id, success)."""
    job_id = None
    callback_url = None

    try:
        job = json.loads(message["data"])

        job_id = job["job_id"]
        image_path = job["image_path"]
        callback_url = job["callback_url"]

        print(f"📥 รับ job_id={job_id}")

        image = preprocess_image(image_path, job_id)
        h, w = image.shape[:2]

        ocr_result = extract_text_with_log(image)

        parsed = parse_bill_slip(
            words=ocr_result["words"],
            image_width=w,
            image_height=h
        )

        # Inject missing fields for Frontend compatibility
        if isinstance(parsed, dict):
            parsed["confidence"] = ocr_result.get("confidence_avg", 0)
            parsed["rawText"] = ocr_result.get("raw_text", "")
            parsed["transactionId"] = job_id  # Use job_id as transactionId

        log_ocr_result(job_id, {
            "job_id": job_id,
            "image_path": image_path,
            "ocr": ocr_result,
            "parsed": parsed
        })

        send_ocr_result(
            callback_url=callback_url,
            slip_id=job_id,
            status="success",
            extracted_data=parsed
        )

        print(f"✅ job_id={job_id} success")

    except Exception as e:
        print(f"❌ job_id={job_id} failed: {e}")
        traceback.print_exc()

        # Try to notify server about the failure (best-effort, don't crash)
        if job_id and callback_url:
            try:
                send_ocr_result(
                    callback_url=callback_url,
                    slip_id=job_id,
                    status="failed",
                    extracted_data={"error": str(e)}
                )
            except Exception as cb_err:
                print(f"⚠️ Callback for failed job also failed: {cb_err}")


def start_consumer():
    """
    Subscribe to Redis Pub/Sub and process OCR jobs.
    Automatically reconnects to Redis with exponential backoff.
    """
    reconnect_delay = INITIAL_RECONNECT_DELAY

    while True:
        try:
            redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                decode_responses=True,
                socket_connect_timeout=10,
                socket_keepalive=True,
                retry_on_timeout=True,
            )

            # Verify connection before subscribing
            redis_client.ping()
            print(f"🟢 Redis connected ({REDIS_HOST}:{REDIS_PORT})")

            pubsub = redis_client.pubsub()
            pubsub.subscribe(REDIS_CHANNEL)

            print(f"🟢 OCR Worker started | channel={REDIS_CHANNEL}")
            reconnect_delay = INITIAL_RECONNECT_DELAY  # reset on success

            for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                _process_job(message)

        except redis.exceptions.ConnectionError as e:
            print(f"🔴 Redis connection lost: {e}")
        except redis.exceptions.TimeoutError as e:
            print(f"🔴 Redis timeout: {e}")
        except Exception as e:
            print(f"🔴 Consumer unexpected error: {e}")
            traceback.print_exc()

        # Exponential backoff reconnect
        print(f"🔄 Reconnecting to Redis in {reconnect_delay}s...")
        time.sleep(reconnect_delay)
        reconnect_delay = min(reconnect_delay * 2, MAX_RECONNECT_DELAY)
