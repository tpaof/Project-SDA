import cv2
import numpy as np
from src.utils.logger import log_image


def preprocess_image(path: str, job_id: str = None):
    """
    Final version - เน้นภาพสะอาด ลด noise จากลายน้ำ
    """
    img = cv2.imread(path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {path}")

    if job_id:
        log_image(job_id, img, "original")

    # 1️⃣ Resize ก่อนเลย
    height, width = img.shape[:2]
    scale = 1600 / height  # ขนาดพอเหมาะ ไม่ใหญ่เกิน
    img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # 2️⃣ Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3️⃣ ลดลายน้ำด้วย Background Subtraction
    # ใช้ morphological opening เพื่อประมาณ background
    kernel_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    background = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel_large)
    
    # ลบ background ออก
    gray = cv2.subtract(gray, background)
    gray = cv2.add(gray, 50)  # เพิ่มความสว่างกลับมา

    # 4️⃣ Denoise แรงขึ้น - ลายน้ำคือ noise
    gray = cv2.fastNlMeansDenoising(gray, None, h=15, templateWindowSize=7, searchWindowSize=21)

    # 5️⃣ CLAHE เบา ๆ
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # 6️⃣ Bilateral filter เบา ๆ - เก็บขอบ
    gray = cv2.bilateralFilter(gray, d=3, sigmaColor=50, sigmaSpace=50)

    # 7️⃣ Sharpen เบา - ไม่เน้นมาก
    gaussian = cv2.GaussianBlur(gray, (0, 0), sigmaX=1.5)
    sharpened = cv2.addWeighted(gray, 1.4, gaussian, -0.4, 0)

    # 8️⃣ Adaptive Threshold - สำคัญที่สุด
    binary = cv2.adaptiveThreshold(
        sharpened,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=21,  # ใหญ่ขึ้นเพื่อลด noise
        C=10  # เพิ่ม C เพื่อให้ background เป็นขาวมากขึ้น
    )
    
    # 9️⃣ ลบ noise ด้วย morphology
    # Remove small black spots
    kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_clean)
    
    # Close gaps in text
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_clean)
    
    # 🔟 Median filter - ลบจุดเล็ก ๆ
    binary = cv2.medianBlur(binary, 3)

    if job_id:
        log_image(job_id, binary, "preprocessed")

    return binary