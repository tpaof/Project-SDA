import os
import json
import requests
from dotenv import load_dotenv
import os

load_dotenv()  # ⭐ สำคัญมาก

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-flash"

GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)


def resolve_with_gemini(
    raw_text: str,
    candidates: list,
    transaction_type: str
) -> dict:
    """
    ใช้ Gemini ช่วยเลือก payer / payee
    candidates = รายชื่อที่ rule-based คัดมาแล้ว
    """

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")

    prompt = f"""
คุณคือระบบช่วยวิเคราะห์สลิปธนาคาร

ประเภทธุรกรรม: {transaction_type}

ข้อความจากสลิป:
\"\"\"{raw_text}\"\"\"

รายชื่อที่อาจเป็นชื่อบุคคลหรือร้าน:
{json.dumps(candidates, ensure_ascii=False)}

กรุณาเลือก:
- payer: ผู้จ่ายเงิน
- payee: ผู้รับเงิน

ตอบเป็น JSON เท่านั้น รูปแบบ:
{{
  "payer": "...",
  "payee": "..."
}}
ถ้าไม่มั่นใจ ให้ใช้ null
"""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    response = requests.post(
        GEMINI_ENDPOINT,
        json=payload,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
    except Exception as e:
        raise RuntimeError(f"Gemini response parse failed: {e}")
