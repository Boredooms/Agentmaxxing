# VANTA video

Two Remotion films cut from real captures of the running VANTA app. No mocked UI, no invented balances and no
mainnet transaction.

## Week 3 — crypto demo (settlement)

**57.88 s · 1920×1080 · 30fps · H.264 + AAC stereo 48 kHz · 7.1 MB**

- **Final file:** [`../artifacts/demo/vanta-crypto-demo.mp4`](../artifacts/demo/vanta-crypto-demo.mp4)
- **Poster:** [`../artifacts/demo/crypto-poster.png`](../artifacts/demo/crypto-poster.png)
- **Capture record:** [`../artifacts/demo/crypto/run.json`](../artifacts/demo/crypto/run.json)
- **Shot list / narration:** [`../artifacts/demo/CRYPTO_DEMO_SCRIPT.md`](../artifacts/demo/CRYPTO_DEMO_SCRIPT.md)
- **Real settlement:** **0.01 USDC** on Base Sepolia, tx
  [`0x9b376282…52f9`](https://sepolia.basescan.org/tx/0x9b376282b627a2d8cadb0a05a770dbbedfa16dfe9b670a8c8802784c7a7352f9),
  block **49,311,297**, status **`0x1`**
- **Wallet:** `0xDa83…bAfe`, **18.87 → 18.86 USDC**

Scenes: wallet hook → real account → approval boundary → x402 approval/verify/settle → before/after proof → close.
The receipt strip is the app's own `SETTLED 0.01 USDC` row; the block, gas and status were verified with
`eth_getTransactionReceipt` on `https://sepolia.base.org`.

```bash
cd video
npm install
npm run render:crypto          # writes out/vanta-crypto-demo.mp4
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/tts-crypto.ps1
```

Capture the screenshots first with `VANTA_BASE_URL=http://localhost:3211 npm run demo:crypto` in the app root. That
command spends **0.01 testnet USDC** and requires the wallet/facilitator environment.

## Week 1 — product explainer (denial path)

**63.55 s · 1920×1080 · 30fps · H.264 + AAC stereo 48 kHz · 6.8 MB**

- **Final file:** [`../artifacts/demo/vanta-explainer.mp4`](../artifacts/demo/vanta-explainer.mp4)
- **Poster:** [`../artifacts/demo/explainer-poster.png`](../artifacts/demo/explainer-poster.png)
- **Storyboard / narration:** [`../artifacts/demo/DEMO_SCRIPT.md`](../artifacts/demo/DEMO_SCRIPT.md)
- **Hosted watch link:** [Google Drive](https://drive.google.com/file/d/1WK4hn56ABNUuTaWi2XbBjuhAqFMdZNRw/view)

The explainer deliberately shows the **denial** path, so it does not claim a settlement. The crypto cut above is the
one that proves the on-chain capability.

```bash
npm run render                 # writes out/vanta-explainer.mp4
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/tts.ps1
```

## Pipeline

Built with the workflow and scaffold from [EveryInc/product-launch-video](https://github.com/EveryInc/product-launch-video)
plus the official [remotion-dev/skills](https://github.com/remotion-dev/skills) Remotion best-practice skills:

1. Capture real UI states with Playwright at 2× device scale.
2. Storyboard printed-report scenes: hook → account → approval → settlement → proof → close.
3. Generate one WAV per scene with local Windows SAPI.
4. Time the Remotion sequences to the measured WAV durations.
5. Render stills, fix clipping/collisions, then render the MP4.
6. Verify duration, streams, audio energy and the on-chain receipt.

## Structure

```text
src/
  Root.tsx              registers VantaExplainer + VantaCryptoDemo
  VantaExplainer.tsx    six-scene product explainer
  VantaCryptoDemo.tsx   six-scene Week 3 crypto cut
  theme.ts              palette + Google-font loading
  ui.tsx                chrome, captions, stamps, screenshot frames
public/
  images/               real app captures (from artifacts/demo)
  audio/                local TTS narration
scripts/tts.ps1         explainer narration
scripts/tts-crypto.ps1  crypto narration
```

## Limitations

- Fonts are fetched from Google Fonts during render, so the first render needs network access.
- The voice is a local desktop TTS voice, not a studio voice actor.
- No music or sound effects.
- The crypto cut is testnet-only. It does not prove mainnet readiness or production custody.
- The crypto MP4 is local; upload it before using a public video link in the Week 3 submission.
