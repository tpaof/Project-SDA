import re
from typing import Dict, Optional

def parse_slip(text: str) -> Dict:
    """
    รับ raw OCR text
    คืน structured data จากสลิป
    """
    result = {
        "amount": None,
        "date": None,
        "time": None,
        "transaction_type": None,
        "bank": None,
        "reference": None
    }

    result["amount"] = extract_amount(text)
    result["date"], result["time"] = extract_datetime(text)
    result["transaction_type"] = extract_transaction_type(text)
    result["bank"] = extract_bank_name(text)
    result["reference"] = extract_reference(text)

    return result

def extract_amount(text: str) -> Optional[str]:
    """
    ดึงยอดเงิน เช่น 1,234.00 หรือ 1234.00
    """
    patterns = [
        r"(\d{1,3}(?:,\d{3})*(?:\.\d{2}))",  # 1,234.00
        r"(\d+\.\d{2})"                     # 1234.00
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)

    return None

def extract_datetime(text: str):
    """
    ดึงวันที่และเวลา
    """
    date = None
    time = None

    date_match = re.search(r"(\d{2}/\d{2}/\d{4})", text)
    if date_match:
        date = date_match.group(1)

    time_match = re.search(r"(\d{2}:\d{2})", text)
    if time_match:
        time = time_match.group(1)

    return date, time

def extract_transaction_type(text: str) -> Optional[str]:
    text_lower = text.lower()

    if "โอน" in text_lower or "transfer" in text_lower:
        return "transfer"
    if "ชำระ" in text_lower or "payment" in text_lower:
        return "payment"
    if "ถอน" in text_lower or "withdraw" in text_lower:
        return "withdraw"
    if "ฝาก" in text_lower or "deposit" in text_lower:
        return "deposit"

    return None

def extract_bank_name(text: str) -> Optional[str]:
    banks = {
        "SCB": ["SCB", "ไทยพาณิชย์"],
        "KBank": ["KBank", "กสิกร"],
        "Bangkok Bank": ["Bangkok", "กรุงเทพ"],
        "Krungsri": ["กรุงศรี", "Krungsri"],
        "KTC": ["KTC"]
    }

    for bank, keywords in banks.items():
        for kw in keywords:
            if kw.lower() in text.lower():
                return bank

    return None

def extract_reference(text: str) -> Optional[str]:
    patterns = [
        r"(?:Ref|REF|Reference|เลขที่)[^\d]*(\d{6,})",
        r"\b(\d{10,})\b"
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)

    return None
