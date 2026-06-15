#!/usr/bin/env bash
# Record the demo: tour the four surfaces and drive a live HELD -> SHIPPED ->
# RELEASED transition through the backend so the app reflects it on refocus.
set -e
cd "$(dirname "$0")/.."
B=http://localhost:4242
U="exp://127.0.0.1:8081/--"
open() { xcrun simctl openurl booted "$U/$1" >/dev/null 2>&1; }
refocus() { open ""; sleep 0.6; open "$1"; }   # leave + re-enter -> useFocusEffect reload

# reset the beanie order to HELD by re-checkout so the arc is clean
beanie=$(curl -s -X POST $B/checkout -H 'content-type: application/json' -d '{"itemId":"i4"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

# start recording
rm -f screenshots/demo.mp4
xcrun simctl io booted recordVideo --codec h264 screenshots/demo.mp4 &
REC=$!
sleep 1.5

open "" ;            sleep 2.5     # Shop
open "orders" ;     sleep 3       # Orders: held / shipped / released
curl -s -X POST $B/orders/$beanie/ship >/dev/null
refocus "orders" ;  sleep 3       # beanie now SHIPPED (confirm button appears)
curl -s -X POST $B/orders/$beanie/release >/dev/null
refocus "orders" ;  sleep 3       # beanie now RELEASED (funds paid out)
open "designer" ;   sleep 3       # Designer: connected account, escrow, payouts
open "admin" ;      sleep 3.5     # Admin: escrow ledger + release / refund
open "" ;           sleep 1.5

kill -INT $REC 2>/dev/null || true
wait $REC 2>/dev/null || true
echo "recorded screenshots/demo.mp4"
