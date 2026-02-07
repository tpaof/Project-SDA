import cv2
import numpy as np
from src.utils.logger import log_image


def preprocess_image(path, job_id=None):
    img = cv2.imread(path)

    if img is None:
        raise FileNotFoundError(f"Image not found: {path}")

    if job_id:
        log_image(job_id, img, "original")

    # 1️⃣ แปลงเป็น grayscale (พอ)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2️⃣ ลด noise เบา ๆ (kernel เล็กลง)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # 3️⃣ เพิ่ม contrast แบบไม่ทำลายตัวอักษร
    # ใช้ adaptive histogram (CLAHE)
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )
    enhanced = clahe.apply(gray)

    # 4️⃣ resize เล็กน้อยให้ตัวอักษรชัดขึ้น
    enhanced = cv2.resize(
        enhanced,
        None,
        fx=1.3,
        fy=1.3,
        interpolation=cv2.INTER_CUBIC
    )

    if job_id:
        log_image(job_id, enhanced, "preprocessed")

    # ⚠️ สำคัญ: คืน grayscale (ไม่ threshold)
    return enhanced
