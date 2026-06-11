# Gmail Email Verifier

This extension verifies an open Gmail message or a downloaded PDF/DOCX
certificate through the VeriForensic provenance API. It does not issue
signatures, embed provenance, encrypt email, or store an ns-stego service
token.

Load `manifest.json` as an unpacked Chrome or Edge extension. Open the extension
settings only when the VeriForensic API origin needs to be changed.

## Verify a Gmail attachment

1. Download the PDF or DOCX attachment from the open Gmail message.
2. In the VeriForensic panel, select the downloaded file.
3. Click **Verify certificate**.

Gmail does not expose attachment bytes directly to page content scripts. The
extension therefore requires local file selection before it can submit the
actual attachment to the certificate verification endpoint. Public
verification does not require a JWT.
