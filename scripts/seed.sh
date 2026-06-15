#!/usr/bin/env bash
# Drive the escrow lifecycle through the backend so every mobile tab shows
# rich state for screenshots: one RELEASED, one SHIPPED, one HELD, one REFUNDED.
set -e
B=http://localhost:4242

j() { curl -s "$@"; }

# RELEASED: scarf (d1) -> ship -> release
o1=$(j -X POST $B/checkout -H 'content-type: application/json' -d '{"itemId":"i1"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
j -X POST $B/orders/$o1/ship >/dev/null
j -X POST $B/orders/$o1/release >/dev/null

# SHIPPED: denim jacket (d2) -> ship, awaiting buyer release
o2=$(j -X POST $B/checkout -H 'content-type: application/json' -d '{"itemId":"i3"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
j -X POST $B/orders/$o2/ship >/dev/null

# HELD: beanie (d2) -> just paid, in escrow
j -X POST $B/checkout -H 'content-type: application/json' -d '{"itemId":"i4"}' >/dev/null

# REFUNDED: coat (d1) -> dispute
o4=$(j -X POST $B/checkout -H 'content-type: application/json' -d '{"itemId":"i2"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
j -X POST $B/orders/$o4/refund >/dev/null

echo "seeded: released=$o1 shipped=$o2 refunded=$o4"
