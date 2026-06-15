# Regenerating screenshots & demo video

Mock backend, no Stripe keys. Everything runs on the iOS Simulator in Expo Go.

## 1. Boot the simulator

```bash
xcrun simctl boot "iPhone 17 Pro" || true
open -a Simulator
```

## 2. Start the mock escrow backend

```bash
npm install
npm run server        # node server/index.mjs -> express on :4242, in-memory state
```

## 3. Start Metro and open the app in Expo Go

```bash
npx expo start --port 8081
xcrun simctl openurl booted "exp://127.0.0.1:8081"   # loads the bundle in Expo Go
```

## 4. Seed the escrow lifecycle (so every tab shows rich state)

```bash
bash scripts/seed.sh   # creates RELEASED + SHIPPED + HELD + REFUNDED orders
```

## 5. Capture screenshots

In Expo Go, routes are reached with the `exp://HOST:8081/--/<route>` deep link,
so no tapping is needed:

```bash
bash scripts/capture.sh   # writes screenshots/01-shop.png .. 04-admin.png
```

`capture.sh` opens `exp://127.0.0.1:8081/--/`, `/--/orders`, `/--/designer`,
`/--/admin` in turn and runs `xcrun simctl io booted screenshot` after each.

## 6. Record the demo video

```bash
bash scripts/record.sh   # writes screenshots/demo.mp4
```

`record.sh` starts `xcrun simctl io booted recordVideo`, tours the four tabs by
deep link, and drives a live `HELD -> SHIPPED -> RELEASED` transition through the
backend so the app updates on refocus. Make the GIF with:

```bash
ffmpeg -i screenshots/demo.mp4 -vf "fps=10,scale=300:-1:flags=lanczos,palettegen" -y /tmp/pal.png
ffmpeg -i screenshots/demo.mp4 -i /tmp/pal.png -lavfi "fps=10,scale=300:-1:flags=lanczos[x];[x][1:v]paletteuse" -y screenshots/demo.gif
```

## How it works

- The app never talks to Stripe. `server/mockStripe.mjs` mimics the `stripe` Node
  SDK shape; each method comments the real call it replaces.
- Escrow = "separate charges and transfers": buyer is charged to the platform
  balance (no `transfer_data`), funds are held, and a `Transfer` to the
  connected account on delivery confirmation is the release.
- The order state machine (`HELD -> SHIPPED -> RELEASED`, or `-> REFUNDED`)
  lives entirely in `server/index.mjs`.
