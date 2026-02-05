import cv2
import numpy as np
from src.utils.logger import log_image

def preprocess_image(path, job_id=None):
    img = cv2.imread(path)

    if job_id:
        log_image(job_id, img, "original")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5,5), 0)

    _, thresh = cv2.threshold(
        gray, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    thresh = cv2.resize(thresh, None, fx=1.5, fy=1.5)

    if job_id:
        log_image(job_id, thresh, "preprocessed")

    return thresh
