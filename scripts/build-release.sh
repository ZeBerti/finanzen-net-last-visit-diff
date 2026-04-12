#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
PACKAGE_DIR="$DIST_DIR/finanzen-net-last-visit-diff"
ZIP_NAME="finanzen-net-last-visit-diff.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

rm -rf "$PACKAGE_DIR" "$ZIP_PATH"
mkdir -p "$PACKAGE_DIR/scripts" "$PACKAGE_DIR/icons"

cp "$ROOT_DIR/manifest.json" "$PACKAGE_DIR/"
cp "$ROOT_DIR/options.html" "$PACKAGE_DIR/"
cp "$ROOT_DIR/popup.js" "$PACKAGE_DIR/"
cp "$ROOT_DIR/scripts/common.js" "$PACKAGE_DIR/scripts/"
cp "$ROOT_DIR/scripts/content.js" "$PACKAGE_DIR/scripts/"
cp "$ROOT_DIR/scripts/tableExpansion.js" "$PACKAGE_DIR/scripts/"
cp "$ROOT_DIR/icons/icon16.png" "$PACKAGE_DIR/icons/"
cp "$ROOT_DIR/icons/icon32.png" "$PACKAGE_DIR/icons/"
cp "$ROOT_DIR/icons/icon48.png" "$PACKAGE_DIR/icons/"
cp "$ROOT_DIR/icons/icon128.png" "$PACKAGE_DIR/icons/"

(
  cd "$DIST_DIR"
  zip -rq "$ZIP_NAME" "finanzen-net-last-visit-diff"
)

echo "Created release package:"
echo "  $ZIP_PATH"
