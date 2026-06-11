# Email Verifier API Contract

The email extensions are verification-only clients of the VeriForensic API.
They must never call ns-stego directly or store an ns-stego service token.

Supported requests:

```text
POST /api/v1/ns-stego/verify-signature
Content-Type: application/json

{"token": "v1..."}
```

```text
POST /api/v1/ns-stego/verify-email
Content-Type: application/json

{"raw": "raw or reconstructed email message"}
```

```text
POST /api/v1/ns-stego/verify-certificate
Content-Type: multipart/form-data

file=<PDF or DOCX certificate, maximum 10 MB>
```

The packaged clients currently default to `https://imageclassifi.fly.dev`, which
serves this facade during migration. Change the verifier API setting to the
dedicated provenance origin after that service is deployed.
