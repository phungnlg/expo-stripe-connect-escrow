#!/usr/bin/env bash
# Capture the four tab screenshots via Expo Go deep links (no taps needed).
# Assumes: backend on :4242 + Metro on :8081 + the app open in Expo Go.
set -e
cd "$(dirname "$0")/.."
U="exp://127.0.0.1:8081/--"
shot() { sleep 2.5; xcrun simctl io booted screenshot "screenshots/$1.png"; echo "shot $1"; }

xcrun simctl openurl booted "$U/"         ; shot 01-shop
xcrun simctl openurl booted "$U/orders"   ; shot 02-orders
xcrun simctl openurl booted "$U/designer" ; shot 03-designer
xcrun simctl openurl booted "$U/admin"    ; shot 04-admin
echo "done"
