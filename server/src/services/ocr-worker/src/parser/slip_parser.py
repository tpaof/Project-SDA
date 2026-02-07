from typing import Dict, List

from src.zoning.bill_zone import (
    BILL_ZONES_BILL,
    BILL_ZONES_TRANSFER,
    in_zone
)
from src.zoning.transaction_detector import TRANSACTION_HEADER_ZONE


# -------------------------------------------------
# Utility
# -------------------------------------------------

def concat_words(words: List[Dict]) -> str:
    """
    รวมคำตามลำดับ y → x
    """
    if not words:
        return None

    sorted_words = sorted(
        words,
        key=lambda w: (
            min(p[1] for p in w["bbox"]),
            min(p[0] for p in w["bbox"])
        )
    )

    return " ".join(w["text"] for w in sorted_words if w.get("text"))


# -------------------------------------------------
# Main parser
# -------------------------------------------------

def parse_bill_slip(
    words: List[Dict],
    image_width: int,
    image_height: int
) -> Dict:
    """
    Parse slip โดยเลือก zone ตาม transaction type
    """

    # 1️⃣ ตรวจจับประเภทธุรกรรม
    transaction_type = transaction_type_detector(
        words,
        image_width,
        image_height
    )

    # 2️⃣ เลือก zone
    if transaction_type == "bill":
        zones = BILL_ZONES_BILL

    elif transaction_type == "transfer":
        zones = BILL_ZONES_TRANSFER

    else:
        raise ValueError(
            "Unknown transaction type: cannot determine bill/transfer"
        )

    # 3️⃣ parse ตาม zone
    result = {
        "transaction_type": transaction_type
    }

    for field, zone in zones.items():
        collected_words = []

        for w in words:
            if "bbox" not in w or "text" not in w:
                continue

            if in_zone(w, zone, image_width, image_height):
                collected_words.append(w)

        result[field] = concat_words(collected_words)

    return result

def transaction_type_detector(
    words: List[Dict],
    image_width: int,
    image_height: int
) -> str:
    """
    ตรวจจับประเภทธุรกรรมจาก header zone
    return: 'bill' | 'transfer' | 'unknown'
    """

    for w in words:
        if "bbox" not in w or "text" not in w:
            continue

        if in_zone(w, TRANSACTION_HEADER_ZONE, image_width, image_height):
            text = w["text"]

            if "จ่ายบิล" in text:
                return "bill"

            if "โอนเงิน" in text:
                return "transfer"

    return "unknown"