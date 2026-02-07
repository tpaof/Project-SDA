import json
import redis
import traceback
import cv2

from config import REDIS_HOST, REDIS_PORT, REDIS_CHANNEL

from src.preprocessing.image import preprocess_image
from src.ocr.extractor import extract_text_with_log
from src.parser.slip_parser import parse_bill_slip
from src.callback.notify import send_ocr_result
from src.utils.logger import log_ocr_result


def start_consumer():

    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True
    )

    pubsub = redis_client.pubsub()
    pubsub.subscribe(REDIS_CHANNEL)

    print(f"🟢 OCR Worker started | channel={REDIS_CHANNEL}")

    for message in pubsub.listen():

        if message["type"] != "message":
            continue

        job_id = None

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

            if job_id:
                send_ocr_result(
                    callback_url=callback_url,
                    slip_id=job_id,
                    status="failed",
                    extracted_data={"error": str(e)}
                )
