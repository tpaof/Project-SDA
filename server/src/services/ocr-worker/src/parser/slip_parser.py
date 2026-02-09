from typing import Dict, List

from src.zoning.bill_zone import (
    BILL_ZONES_BILL,
    BILL_ZONES_TRANSFER,
    in_zone
)
from src.zoning.transaction_detector import TRANSACTION_HEADER_ZONE

import re
from datetime import datetime

# Thai numerals and month name support
_THAI_DIGITS_TRANS = str.maketrans(
    '๐๑๒๓๔๕๖๗๘๙',
    '0123456789'
)

_THAI_MONTHS = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3,
    'เม.ย.': 4,  'พ.ค.': 5, 'มิ.ย.': 6,
    'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9,
    'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
}


def _to_ascii_digits(s: str) -> str:
    if not s:
        return s
    return s.translate(_THAI_DIGITS_TRANS)


def normalize_date(date_str: str) -> str | None:
    """Try to normalize a free-form OCR date string to ISO 8601 (YYYY-MM-DD).

    Returns ISO string or None if parsing fails.
    """
    if not date_str:
        return None

    s = date_str.strip()
    s = _to_ascii_digits(s)

    # handle Thai month names like '1 ก.พ. 2025' or '01 กุมภาพันธ์ 2025'
    m = re.search(r"(\d{1,2})\s*([\u0E00-\u0E7F\.]+)\s*(\d{2,4})", s)
    if m:
        day = m.group(1)
        mon_txt = m.group(2).strip()
        year = m.group(3)
        # try match thai short month
        if mon_txt in _THAI_MONTHS:
            month = _THAI_MONTHS[mon_txt]
            y = int(year)
            if y < 100:
                y += 2000
            try:
                dt = datetime(y, month, int(day))
                return dt.strftime('%Y-%m-%d')
            except Exception:
                pass

    # Extract candidate date tokens like 01/02/2025, 01-02-25, 2025.02.01
    candidates = re.findall(r"\d{1,4}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{1,4}", s)
    if not candidates:
        # fallback: look for 8 contiguous digits (YYYYMMDD)
        m2 = re.search(r"(\d{8})", s)
        if m2:
            v = m2.group(1)
            try:
                dt = datetime.strptime(v, '%Y%m%d')
                return dt.strftime('%Y-%m-%d')
            except Exception:
                pass
        return None

    formats = [
        '%d/%m/%Y', '%d/%m/%y', '%d-%m-%Y', '%d-%m-%y', '%d.%m.%Y', '%d.%m.%y',
        '%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d'
    ]

    for cand in candidates:
        token = re.sub(r"[\s]+", '', cand).replace('.', '/').replace('-', '/').replace('\u200b', '')
        # try various formats by replacing separators consistently
        token_slash = token.replace('-', '/').replace('.', '/')
        parts = token_slash.split('/')
        # normalize two-digit years
        if len(parts) == 3 and len(parts[2]) == 2:
            parts[2] = str(int(parts[2]) + 2000)
            token_slash = '/'.join(parts)

        for fmt in formats:
            try:
                dt = datetime.strptime(token_slash, fmt)
                return dt.strftime('%Y-%m-%d')
            except Exception:
                continue

    return None


def normalize_amount(amount_str: str) -> float | None:
    """Normalize OCR amount string to float.

    Handles Thai digits, commas/dots, and common currency words.
    Returns float or None on failure.
    """
    if not amount_str:
        return None

    s = _to_ascii_digits(amount_str)
    s = s.replace('บาท', '').replace('฿', '').replace('THB', '')
    s = s.strip()

    # find number-like substring
    m = re.search(r"\d[\d,\.]*\d|\d+", s)
    if not m:
        return None

    num = m.group(0)
    # If both comma and dot present, assume dot is decimal separator
    if ',' in num and '.' in num:
        num = num.replace(',', '')
    else:
        # remove thousand separators (commas or spaces)
        num = num.replace(',', '').replace(' ', '')

    try:
        return float(num)
    except Exception:
        return None


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

        value = concat_words(collected_words)

        # Normalize date field to ISO 8601 if possible
        if field == "date" and value:
            iso = normalize_date(value)
            result[field] = iso if iso is not None else value
        else:
            result[field] = value

    # -----------------------------
    # Build transaction payload (matches README POST /api/transactions)
    # -----------------------------
    # amount -> float
    amt = normalize_amount(result.get('amount'))

    # date -> ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SS.sssZ)
    raw_date = result.get('date')
    date_iso = None
    if raw_date:
        if re.match(r"^\d{4}-\d{2}-\d{2}$", raw_date):
            date_iso = f"{raw_date}T00:00:00.000Z"
        else:
            nd = normalize_date(raw_date)
            if nd:
                date_iso = f"{nd}T00:00:00.000Z"

    if not date_iso:
        # fallback to current UTC date
        date_iso = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')

    # description: prefer payee then payer then transaction type
    description = result.get('payee') or result.get('payer') or ''

    transaction_payload = {
        'type': 'expense',
        'amount': amt if amt is not None else 0.0,
        'date': date_iso,
        'description': description,
        'category': 'demo'
    }

    return transaction_payload

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