import cv2
import numpy as np
from src.utils.logger import log_image


def preprocess_image(path: str, job_id: str = None):
    """
    Preprocess image for OCR (Thai + Number friendly)

    Strategy:
    - Preserve Thai characters (no hard threshold)
    - Improve contrast gently (CLAHE)
    - Reduce noise without breaking strokes
    """

    img = cv2.imread(path)

    if img is None:
        raise FileNotFoundError(f"Image not found: {path}")

    if job_id:
        log_image(job_id, img, "original")

    # --------------------
    # 1. Convert to grayscale
    # --------------------
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --------------------
    # 2. Gentle denoise (preserve edges)
    # --------------------
    gray = cv2.bilateralFilter(
        gray,
        d=9,
        sigmaColor=75,
        sigmaSpace=75
    )

    # --------------------
    # 3. Local contrast enhancement (SAFE)
    # --------------------
    # CLAHE improves numbers without killing Thai strokes
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )
    enhanced = clahe.apply(gray)

    # --------------------
    # 4. Mild adaptive threshold (NOT binary)
    # --------------------
    # Key: Gaussian + small blockSize
    thresh = cv2.adaptiveThreshold(
        enhanced,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=5
    )

    # --------------------
    # 5. Blend original & threshold (IMPORTANT)
    # --------------------
    # This prevents over-destruction of characters
    final = cv2.addWeighted(
        enhanced, 0.7,
        thresh, 0.3,
        0
    )

    # --------------------
    # 6. Resize (moderate, not aggressive)
    # --------------------
    final = cv2.resize(
        final,
        None,
        fx=1.3,
        fy=1.3,
        interpolation=cv2.INTER_CUBIC
    )

    if job_id:
        log_image(job_id, final, "preprocessed")

    return final
