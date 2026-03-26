#!/bin/bash
set -euo pipefail

# norch DMG Build Script
# Usage: ./scripts/build-dmg.sh [version]
# Example: ./scripts/build-dmg.sh 0.1.0

VERSION="${1:-0.1.0}"
APP_NAME="norch"
MACOS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$MACOS_DIR/build"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
DMG_NAME="$APP_NAME-$VERSION.dmg"
DMG_PATH="$BUILD_DIR/$DMG_NAME"
STAGING="$BUILD_DIR/dmg-staging"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  norch DMG Builder v$VERSION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Compile
echo ""
echo "[1/5] Compiling Swift..."
cd "$MACOS_DIR"

swiftc \
  -o "$APP_BUNDLE/Contents/MacOS/$APP_NAME" \
  -target arm64-apple-macosx14.0 \
  -sdk "$(xcrun --show-sdk-path)" \
  -framework AppKit -framework SwiftUI -framework WebKit \
  -O -parse-as-library \
  norch/NorchApp.swift \
  norch/NorchAppDelegate.swift \
  norch/NorchBarView.swift \
  norch/AgentData.swift \
  norch/NorchState.swift \
  norch/AgentImage.swift \
  norch/NorchSocketServer.swift

echo "  ✓ Compiled"

# 2. Update Info.plist version
echo "[2/5] Updating Info.plist..."
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $VERSION" "$APP_BUNDLE/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$APP_BUNDLE/Contents/Info.plist"
echo "  ✓ Version set to $VERSION"

# 3. Copy resources
echo "[3/5] Copying resources..."
RESOURCES="$APP_BUNDLE/Contents/Resources"
mkdir -p "$RESOURCES"
cp "$MACOS_DIR/../public/agents/"*.svg "$RESOURCES/" 2>/dev/null || true
echo "  ✓ $(ls "$RESOURCES"/*.svg 2>/dev/null | wc -l | tr -d ' ') SVG files copied"

# 4. Create DMG
echo "[4/5] Creating DMG..."
rm -rf "$STAGING" "$DMG_PATH"
mkdir -p "$STAGING"
cp -R "$APP_BUNDLE" "$STAGING/"
ln -s /Applications "$STAGING/Applications"

hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$STAGING" \
  -ov -format UDZO \
  "$DMG_PATH" \
  > /dev/null 2>&1

rm -rf "$STAGING"
echo "  ✓ $DMG_NAME created"

# 5. Checksum
echo "[5/5] Generating checksum..."
CHECKSUM=$(shasum -a 256 "$DMG_PATH" | awk '{print $1}')
echo "$CHECKSUM  $DMG_NAME" > "$BUILD_DIR/$DMG_NAME.sha256"
echo "  ✓ SHA-256: ${CHECKSUM:0:16}..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build Complete!"
echo ""
echo "  DMG:      $DMG_PATH"
echo "  Checksum: $BUILD_DIR/$DMG_NAME.sha256"
echo "  Size:     $(du -h "$DMG_PATH" | awk '{print $1}')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
