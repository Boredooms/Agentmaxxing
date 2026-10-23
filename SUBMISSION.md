# VANTA — Week 3 submission

**Give it a job. Keep the receipts.**

## Links

| Item | Link |
| --- | --- |
| GitHub repository | <https://github.com/Boredooms/Agentmaxxing> |
| Week 3 crypto demo (watch) | [Google Drive](https://drive.google.com/file/d/1Xj1Vv1m76SJ_vCIX6gYc28-eO_zWdl0_/view) |
| Week 3 crypto demo (local file) | [`artifacts/demo/vanta-crypto-demo.mp4`](artifacts/demo/vanta-crypto-demo.mp4) |
| X launch kit | [`artifacts/social/X_CONTENT_PLAN.md`](artifacts/social/X_CONTENT_PLAN.md) |
| Crypto demo poster | [`artifacts/demo/crypto-poster.png`](artifacts/demo/crypto-poster.png) |
| Crypto shot list + narration | [`artifacts/demo/CRYPTO_DEMO_SCRIPT.md`](artifacts/demo/CRYPTO_DEMO_SCRIPT.md) |
| Raw capture + chain receipt | [`artifacts/demo/crypto/run.json`](artifacts/demo/crypto/run.json) |
| Week 1 explainer (hosted) | [Google Drive](https://drive.google.com/file/d/1WK4hn56ABNUuTaWi2XbBjuhAqFMdZNRw/view) |
| Brand kit | [`public/brand/vanta-brand-kit.zip`](public/brand/vanta-brand-kit.zip) |
| X account | <https://x.com/vantanss7> |

The Week 3 Google Drive file is the crypto cut and is byte-identical to the committed 7,089,440-byte master
(SHA-256 `b46175c6…eaf917`). The other Google Drive link is the Week 1 explainer, which shows the denial path.

## Crypto proof

- **Tool:** `get_weather`
- **Mission:** “What is the weather in Mumbai?”
- **Price:** **0.01 USDC**
- **Network:** **Base Sepolia testnet**
- **Transaction:** [`0x9b376282b627a2d8cadb0a05a770dbbedfa16dfe9b670a8c8802784c7a7352f9`](https://sepolia.basescan.org/tx/0x9b376282b627a2d8cadb0a05a770dbbedfa16dfe9b670a8c8802784c7a7352f9)
- **Block:** 49,311,297
- **Status:** `0x1` success
- **Wallet:** `0xDa83…bAfe`, **18.87 → 18.86 USDC**
- **Verification:** `eth_getTransactionReceipt` on `https://sepolia.base.org`

## Week 3 requirements

- [x] Wallet set up — server-held Base Sepolia agent wallet with testnet ETH and USDC
- [x] Base Sepolia configured — testnet chain, explorer links, no mainnet path
- [x] Crypto capability — x402 paid resources, EIP-3009 authorization, USDC settlement
- [x] Human approval — opaque, single-use, five-minute approval before a paid call
- [x] On-chain receipt — real transaction hash and block shown in the workspace and the demo
- [x] Demo/video — 57.88s, 1920×1080, H.264 + AAC stereo, real settlement
- [x] Repository docs — README, build log, crypto shot list and raw capture record
- [x] Public crypto video URL — [Google Drive](https://drive.google.com/file/d/1Xj1Vv1m76SJ_vCIX6gYc28-eO_zWdl0_/view)
- [x] X account and launch kit — <https://x.com/vantanss7> · [`artifacts/social/X_CONTENT_PLAN.md`](artifacts/social/X_CONTENT_PLAN.md)
- [ ] Public live deployment — existing Vercel deployment has not been re-verified or redeployed

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `/workspace`, `/brand`, and the `Week 3 / x402` section on `/`. A real paid run needs a testnet wallet and
facilitator in `.env`. The demo cut was verified with the local production build:

```bash
npm run build
npm run start -- -p 3211
VANTA_BASE_URL=http://localhost:3211 npm run demo:crypto
cd video && npm run render:crypto
```
