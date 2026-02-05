from src.parser.slip_parser import parse_slip

def test_parse():
    sample = "วันที่ 01/02/2025 ยอดเงิน 1,234.00 บาท"
    result = parse_slip(sample)
    assert result["amount"] == "1,234.00"
