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

PROJECT_ROOT="$MACOS_DIR/.."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  norch DMG Builder v$VERSION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 0. Build Next.js standalone
echo ""
echo "[0/6] Building Next.js..."
cd "$PROJECT_ROOT"
npm run build
echo "  ✓ Next.js built"

# 1. Compile
echo ""
echo "[1/6] Compiling Swift..."
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
  norch/NorchSocketServer.swift \
  norch/NorchProcessManager.swift

echo "  ✓ Compiled"

# 2. Update Info.plist version
echo "[2/6] Updating Info.plist..."
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $VERSION" "$APP_BUNDLE/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$APP_BUNDLE/Contents/Info.plist"
echo "  ✓ Version set to $VERSION"

# 3. Copy resources + bundle server
echo "[3/6] Copying resources & bundling server..."
RESOURCES="$APP_BUNDLE/Contents/Resources"
mkdir -p "$RESOURCES"
cp "$PROJECT_ROOT/public/agents/"*.svg "$RESOURCES/" 2>/dev/null || true
echo "  ✓ $(ls "$RESOURCES"/*.svg 2>/dev/null | wc -l | tr -d ' ') SVG files copied"

# Bundle Next.js standalone + WS relay into Resources/server/
SERVER_BUNDLE="$RESOURCES/server"
rm -rf "$SERVER_BUNDLE"
cp -R "$PROJECT_ROOT/.next/standalone" "$SERVER_BUNDLE"
# Static assets & public dir required by standalone
cp -R "$PROJECT_ROOT/.next/static" "$SERVER_BUNDLE/.next/static"
cp -R "$PROJECT_ROOT/public" "$SERVER_BUNDLE/public"
# Combined launcher
cp "$PROJECT_ROOT/server/launch.mjs" "$SERVER_BUNDLE/"
# ws module (needed by launch.mjs relay)
mkdir -p "$SERVER_BUNDLE/node_modules/ws"
cp -R "$PROJECT_ROOT/node_modules/ws/"* "$SERVER_BUNDLE/node_modules/ws/"
echo "  ✓ Server bundle created ($(du -sh "$SERVER_BUNDLE" | awk '{print $1}'))"

# 4. Create DMG
echo "[4/6] Creating DMG..."
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
echo "[5/6] Generating checksum..."
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
