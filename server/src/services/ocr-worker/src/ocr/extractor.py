import pytesseract
from pytesseract import Output
from config import TESSERACT_CMD

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

def extract_text_with_log(image):
    data = pytesseract.image_to_data(
        image,
        lang="tha+eng",
        config="--psm 6",
        output_type=Output.DICT
    )

    words = []
    confidences = []

    for text, conf in zip(data["text"], data["conf"]):
        if text.strip() == "":
            continue
        try:
            conf_int = int(conf)
            if conf_int >= 0:
                words.append({
                    "text": text,
                    "confidence": conf_int
                })
                confidences.append(conf_int)
        except ValueError:
            continue

    avg_conf = sum(confidences) / len(confidences) if confidences else 0

    full_text = " ".join([w["text"] for w in words])

    return {
        "raw_text": full_text,
        "confidence_avg": round(avg_conf, 2),
        "words": words
    }
