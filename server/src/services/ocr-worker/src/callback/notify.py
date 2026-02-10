import requests
import time


class CallbackError(Exception):
    """custom exception สำหรับ callback error"""
    pass


def send_ocr_result(
    callback_url: str,
    slip_id: str,
    status: str,
    extracted_data: dict,
    max_retry: int = 5,
    timeout: int = 10
):
    """
    ส่งผล OCR ไปยัง main API

    Parameters:
    - callback_url: URL ของ main API
    - slip_id: id ของสลิป
    - status: success | failed
    - extracted_data: ข้อมูลที่ parse แล้ว
    """

    payload = {
        "slipId": slip_id,
        "status": status,
        "data": extracted_data
    }

    for attempt in range(1, max_retry + 1):
        try:
            response = requests.post(
                callback_url,
                json=payload,
                timeout=timeout
            )

            if response.status_code == 200:
                return True

            raise CallbackError(
                f"HTTP {response.status_code}: {response.text}"
            )

        except requests.exceptions.ConnectionError as e:
            # Server might not be ready yet
            print(f"⚠️ Callback attempt {attempt}/{max_retry} connection error: {e}")
        except CallbackError:
            raise
        except Exception as e:
            print(f"⚠️ Callback attempt {attempt}/{max_retry} error: {e}")

        if attempt == max_retry:
            raise CallbackError(
                f"Callback failed after {max_retry} attempts for slip {slip_id}"
            )

        # Exponential backoff: 3s, 6s, 12s, 24s
        backoff = 3 * (2 ** (attempt - 1))
        print(f"🔄 Retrying callback in {backoff}s...")
        time.sleep(backoff)
