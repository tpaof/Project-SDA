import easyocr
import numpy as np

# init reader ครั้งเดียว (สำคัญมาก)
reader = easyocr.Reader(
    ['th', 'en'],
    gpu=False
)

def extract_text_with_log(image):
    """
    OCR ด้วย EasyOCR
    คืน text + confidence + bbox
    """

    results = reader.readtext(image)

    words = []
    confidences = []
    texts = []

    for bbox, text, conf in results:
        if not text.strip():
            continue

        word = {
            "text": text.strip(),
            "confidence": round(conf * 100, 2),
            "bbox": bbox  # <<<<<< สำคัญที่สุด
        }

        words.append(word)
        confidences.append(word["confidence"])
        texts.append(word["text"])

    avg_conf = sum(confidences) / len(confidences) if confidences else 0

    return {
        "raw_text": " ".join(texts),
        "confidence_avg": round(avg_conf, 2),
        "words": words
    }
