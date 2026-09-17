"""Check the customer-visible PDF text, including the long-document variant."""
import re
import subprocess

for path in (
    "tmp/invoice-payment/invoice-payment.pdf",
    "tmp/invoice-payment/invoice-payment-long.pdf",
):
    text = subprocess.check_output(["pdftotext", "-layout", path, "-"], text=True)
    assert re.search(r"LEVERDATUM\s+14-09-2026", text), f"{path}: delivery date missing or confused with invoice date"
    assert "16-09-2026" in text, f"{path}: invoice date missing"
    assert "30-09-2026" in text, f"{path}: due date missing"
    assert "21%" in text, f"{path}: explicit VAT rate missing"
    print(f"{path}: delivery date, invoice date, due date and VAT rate verified")
