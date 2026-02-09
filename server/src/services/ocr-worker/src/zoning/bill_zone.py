from typing import List, Dict

def bbox_center(bbox):
    xs = [p[0] for p in bbox]
    ys = [p[1] for p in bbox]
    return sum(xs) / 4, sum(ys) / 4


def in_zone(word, zone, W, H):
    """
    ตรวจว่า bbox อยู่ใน zone หรือไม่
    zone = {x1, y1, x2, y2} เป็นสัดส่วน 0–1
    """
    cx, cy = bbox_center(word["bbox"])

    return (
        zone["x1"] * W <= cx <= zone["x2"] * W
        and zone["y1"] * H <= cy <= zone["y2"] * H
    )


# -------------------------
# BILL PAYMENT ZONES
# -------------------------

BILL_ZONES_BILL = {
    # ผู้โอน (ชื่อ + บัญชี)
    "payer": {
        "x1": 0.208,
        "x2": 0.988,
        "y1": 0.31,
        "y2": 0.358,
    },

    # ผู้รับ (ร้าน / merchant)
    "payee": {
        "x1": 0.208,
        "x2": 0.988,
        "y1": 0.457,
        "y2": 0.509,
    },

    # จำนวนเงิน
    "amount": {
        "x1": 0.271,
        "x2": 0.877,
        "y1": 0.769,
        "y2": 0.826,
    },

    # วันที่
    "date": {
        "x1": 0.489,
        "x2": 0.979,
        "y1": 0.891,
        "y2": 0.948,
    },
}

BILL_ZONES_TRANSFER = {
    # ผู้โอน (ชื่อ + บัญชี)
    "payer": {
        "x1": 0.210,
        "x2": 0.986,
        "y1": 0.365,
        "y2": 0.415,
    },

    # ผู้รับ (ร้าน / merchant)
    "payee": {
        "x1": 0.210,
        "x2": 0.986,
        "y1": 0.577,
        "y2": 0.627,
    },

    # จำนวนเงิน
    "amount": {
        "x1": 0.279,
        "x2": 0.864,
        "y1": 0.754,
        "y2": 0.815,
    },

    # วันที่
    "date": {
        "x1": 0.434,
        "x2": 0.965,
        "y1": 0.876,
        "y2": 0.944,
    },
}