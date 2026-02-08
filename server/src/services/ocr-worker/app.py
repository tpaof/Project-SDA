from threading import Thread
from flask import Flask, jsonify, request

# OCR worker
from src.queue.consumer import start_consumer

# health check
from src.health.health import get_health_status


# --------------------
# Flask App
# --------------------
app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    """
    Health check endpoint
    ใช้ตรวจสถานะ service, Redis, EasyOCR
    """
    return jsonify(get_health_status()), 200


@app.route("/callback/ocr", methods=["POST"])
def ocr_callback():
    """
    Callback endpoint
    Worker จะ POST ผล OCR กลับมาที่นี่
    """
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "status": "error",
            "message": "No JSON payload received"
        }), 400

    # แสดงผลเพื่อ demo / debug
    print("📥 OCR CALLBACK RECEIVED")
    print(data)

    return jsonify({
        "status": "received",
        "job_id": data.get("job_id")
    }), 200


# --------------------
# Runner
# --------------------
def run_health_server():
    """
    รัน HTTP server สำหรับ health check + callback
    """
    app.run(
        host="0.0.0.0",
        port=8080,
        debug=False,
        use_reloader=False,
        threaded=True   # ⭐ สำคัญมาก ⭐
    )



if __name__ == "__main__":
    print("🔥 app.py with callback loaded")
    # 1️⃣ start OCR consumer (background thread)
    consumer_thread = Thread(
        target=start_consumer,
        daemon=True
    )
    consumer_thread.start()

    print("🟢 OCR consumer started")

    # 2️⃣ start health + callback server (main thread)
    print("🟢 Health & callback server running on :8080")
    run_health_server()
