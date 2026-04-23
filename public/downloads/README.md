# nicrypt-stego-client 0.1.0

This folder contains the built distribution artifacts (wheel + sdist) for **nicrypt-stego-client**.

Install from the wheel:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install ./*.whl
```

Client example:

```python
from client import NicryptStegoClient

c = NicryptStegoClient(base_url="http://127.0.0.1:8125/v1", token="YOUR_JWT")
resp = c.provenance_verdict(headers={"From": "sender@example.com"})
print(resp)
```

Notes:
- These builds are proprietary; distribute only to licensed recipients.
