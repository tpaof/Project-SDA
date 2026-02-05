import json
import redis
import traceback

from config import REDIS_HOST, REDIS_PORT, REDIS_CHANNEL

# preprocessing
from src.preprocessing.image import preprocess_image

# OCR
from src.ocr.extractor import extract_text_with_log

# parsing
from src.parser.slip_parser import parse_slip

# callback
from src.callback.notify import send_ocr_result

# logging
from src.utils.logger import log_ocr_result


def start_consumer():
    """
    OCR Worker main consumer
    ฟัง job จาก Redis แล้วประมวลผลตาม pipeline
    """

    # 1️⃣ connect Redis
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True
    )

    pubsub = redis_client.pubsub()
    pubsub.subscribe(REDIS_CHANNEL)

    print(f"🟢 OCR Worker started | channel={REDIS_CHANNEL}")

    # 2️⃣ listen loop (ทำงานตลอด)
    for message in pubsub.listen():

        # Redis ส่งหลาย event (subscribe / message)
        if message["type"] != "message":
            continue

        job_id = None

        try:
            # 3️⃣ parse job
            job = json.loads(message["data"])

            job_id = job.get("job_id")
            image_path = job.get("image_path")
            callback_url = job.get("callback_url")

            if not job_id or not image_path or not callback_url:
                raise ValueError("job payload ไม่ครบ (job_id / image_path / callback_url)")

            print(f"📥 รับ job_id={job_id}")

            # 4️⃣ preprocess image (+ save debug image)
            image = preprocess_image(
                image_path,
                job_id=job_id
            )

            # 5️⃣ OCR
            ocr_result = extract_text_with_log(image)

            # 6️⃣ parse text
            parsed_data = parse_slip(ocr_result["raw_text"])

            # 7️⃣ log OCR + parse result
            log_ocr_result(job_id, {
                "job_id": job_id,
                "image_path": image_path,
                "ocr": ocr_result,
                "parsed": parsed_data
            })

            # 8️⃣ send success callback
            send_ocr_result(
                callback_url=callback_url,
                slip_id=job_id,
                status="success",
                extracted_data=parsed_data
            )

            print(
                f"✅ job_id={job_id} success "
                f"(conf={ocr_result['confidence_avg']})"
            )

        except Exception as e:
            print(f"❌ job_id={job_id} failed: {e}")
            traceback.print_exc()

            # log error
            if job_id:
                log_ocr_result(job_id, {
                    "job_id": job_id,
                    "status": "failed",
                    "error": str(e),
                    "traceback": traceback.format_exc()
                })

            # callback failed
            try:
                if job_id and "callback_url" in locals():
                    send_ocr_result(
                        callback_url=callback_url,
                        slip_id=job_id,
                        status="failed",
                        extracted_data={"error": str(e)}
                    )
            except Exception as callback_error:
                print(f"🚨 callback error: {callback_error}")
