from threading import Thread
from flask import Flask, jsonify

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
    ใช้ตรวจสถานะ service, Redis, Tesseract
    """
    return jsonify(get_health_status()), 200


# --------------------
# Runner
# --------------------
def run_health_server():
    """
    รัน HTTP server สำหรับ health check
    """
    app.run(
        host="0.0.0.0",
        port=8080,
        debug=False,
        use_reloader=False  # สำคัญมาก (ไม่งั้น thread จะรันซ้ำ)
    )


if __name__ == "__main__":
    # 1️⃣ start OCR consumer (background thread)
    consumer_thread = Thread(
        target=start_consumer,
        daemon=True
    )
    consumer_thread.start()

    print("🟢 OCR consumer started")

    # 2️⃣ start health check server (main thread)
    print("🟢 Health check server running on :8080")
    run_health_server()
