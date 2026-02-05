# src/utils/logger.py

import json
import os
from datetime import datetime
import cv2

BASE_LOG_DIR = "logs"


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def log_image(job_id, image, stage):
    """
    stage: 'original' | 'preprocessed'
    """
    ensure_dir(f"{BASE_LOG_DIR}/images/{job_id}")

    file_path = f"{BASE_LOG_DIR}/images/{job_id}/{stage}.png"
    cv2.imwrite(file_path, image)


def log_ocr_result(job_id, log_data):
    ensure_dir(f"{BASE_LOG_DIR}/ocr")

    file_path = f"{BASE_LOG_DIR}/ocr/{job_id}_ocr.json"

    log_data["timestamp"] = datetime.utcnow().isoformat()

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(log_data, f, ensure_ascii=False, indent=2)
