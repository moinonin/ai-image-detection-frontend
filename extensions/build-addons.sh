#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
OUTPUT="$ROOT/../public/downloads/addons"

mkdir -p "$OUTPUT"

TEMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/veriforensic-addons.XXXXXX")
trap 'rm -rf "$TEMP_DIR"' EXIT
GMAIL_ARCHIVE="$TEMP_DIR/gmail-extension.zip"
OUTLOOK_ARCHIVE="$TEMP_DIR/outlook-addin.zip"
THUNDERBIRD_ARCHIVE="$TEMP_DIR/thunderbird-addon.xpi"

(
  cd "$ROOT/gmail"
  zip -qr "$GMAIL_ARCHIVE" .
)

(
  cd "$ROOT/outlook"
  zip -qr "$OUTLOOK_ARCHIVE" .
)

(
  cd "$ROOT/thunderbird"
  zip -qr "$THUNDERBIRD_ARCHIVE" .
)

mv "$GMAIL_ARCHIVE" "$OUTPUT/gmail-extension.zip"
mv "$OUTLOOK_ARCHIVE" "$OUTPUT/outlook-addin.zip"
mv "$THUNDERBIRD_ARCHIVE" "$OUTPUT/thunderbird-addon.xpi"

printf 'stamp=%s\n' "$(date -u +%Y%m%d-%H%M%S)" > "$OUTPUT/build-info.txt"
printf 'source=extensions/\n' >> "$OUTPUT/build-info.txt"
