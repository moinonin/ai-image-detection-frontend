# Outlook Email Verifier

The add-in verifies the selected message through the VeriForensic provenance
API. It does not store an ns-stego service token.

Outlook add-ins must load their task pane from HTTPS. Host `taskpane.html` and
`taskpane.js`, update `SourceLocation` in `manifest.xml`, then upload the
manifest through Outlook's custom add-in interface.
