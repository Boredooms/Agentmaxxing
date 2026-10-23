# VANTA — Week 3 crypto demo

**Runtime:** 57.88 seconds · **Format:** 1920×1080, 30fps, H.264 + AAC stereo 48 kHz · **Size:** 7.1 MB  
**Voice:** local Windows SAPI (`Microsoft Zira Desktop`) · **Music/SFX:** none  
**Final artifact:** [`vanta-crypto-demo.mp4`](vanta-crypto-demo.mp4) · **Watch:** [Google Drive](https://drive.google.com/file/d/1Xj1Vv1m76SJ_vCIX6gYc28-eO_zWdl0_/view) · **Poster:** [`crypto-poster.png`](crypto-poster.png)

This is the **settlement** cut, not the denial explainer. It follows one real paid mission from wallet to approval to an
on-chain Base Sepolia transaction. No mainnet transaction was made.

## The transaction

| Field | Value |
| --- | --- |
| Mission | “What is the weather in Mumbai?” |
| Tool | `get_weather` |
| Price | **0.01 USDC** |
| Network | **Base Sepolia testnet** |
| Wallet | `0xDa833385f8fc281E4117422CaEC6FCfbB1a2bAfe` (short: `0xDa83…bAfe`) |
| Wallet before | **18.87 USDC** |
| Wallet after | **18.86 USDC** |
| Transaction | [`0x9b376282b627a2d8cadb0a05a770dbbedfa16dfe9b670a8c8802784c7a7352f9`](https://sepolia.basescan.org/tx/0x9b376282b627a2d8cadb0a05a770dbbedfa16dfe9b670a8c8802784c7a7352f9) |
| Base Sepolia block | **49,311,297** (`0x2f06e41`) |
| Receipt status | **`0x1` success** |
| Gas used | **85,788** (`0x14f1c`) |
| Captured | **2026-10-23T19:35:33.835Z** |

The transaction was captured from the running workspace and independently checked with
`eth_getTransactionReceipt` against `https://sepolia.base.org`. The wallet balance was read before and after the run.
The raw capture record is [`crypto/run.json`](crypto/run.json).

## What the crypto path actually does

1. **Intent gate.** The mission is classified before the model receives a toolbox. A weather request unlocks
   `get_weather`; unrelated questions only see free tools.
2. **Approval.** The server holds the resumable turn and issues an opaque, single-use approval id with a five-minute
   expiry. The browser receives the display card, not the state needed to resume.
3. **Approve.** The server consumes the approval once, re-validates the tool, arguments, price, intent and run budget,
   then executes the paid tool.
4. **x402 + EIP-3009.** The paid endpoint returns an x402 challenge. The agent signs an EIP-3009 authorization; the
   facilitator verifies the signature, demand and nonce, then submits settlement on Base Sepolia.
5. **Receipt.** The paid step returns a transaction hash. The workspace shows `SETTLED 0.01 USDC` and links to
   BaseScan. The trace keeps the input, output, duration and receipt.
6. **No mainnet path.** The wallet and facilitator are testnet-only.

## Storyboard

| # | Time | Scene | Visual | Narration |
|---|------|-------|--------|-----------|
| 1 | 0:00–0:07.5 | The wallet | “It has a wallet. Now give it a job.” + real wallet card | “VANTA has a wallet. Testnet USDC on Base Sepolia, and a human approval before every paid call.” |
| 2 | 0:07.5–0:18.0 | The account | Real address, ETH gas and 18.87 USDC, live read | “The wallet is real. An address on Base Sepolia, testnet ETH for gas, and eighteen point eight seven USDC for work. No mainnet path.” |
| 3 | 0:18.0–0:29.0 | The approval | Dark field; real `get_weather` approval card, 0.01 USDC, Base Sepolia | “Ask for the weather in Mumbai. VANTA selects get weather, and stops. The approval names the exact call, the price, and the network. Nothing runs until you decide.” |
| 4 | 0:29.0–0:39.3 | The settlement | Approve → verify → settle flow; real receipt strip, tx hash and block | “You approve. The server consumes a single-use approval, verifies the x402 payment, and settles on chain. The trace records the transaction.” |
| 5 | 0:39.3–0:48.3 | The proof | 18.87 → 18.86 USDC; before/after wallet cards; explorer link | “The wallet moves from eighteen point eight seven to eighteen point eight six USDC. A real Base Sepolia transaction, with a receipt you can open.” |
| 6 | 0:48.3–0:57.9 | Close | Cobalt end card, repository, x402 / testnet / human approval | “VANTA. Give it a job. Keep the receipts. Testnet only. Human approval. Real receipts.” |

## Reproduce

Capture requires a configured testnet wallet and facilitator. **This spends 0.01 testnet USDC.**

```bash
# terminal 1
npm run build
npm run start -- -p 3211

# terminal 2
VANTA_BASE_URL=http://localhost:3211 npm run demo:crypto
```

`demo:crypto` writes the approval, result, wallet and receipt captures to `artifacts/demo/crypto/`, verifies the
transaction receipt with Base Sepolia RPC, and writes `run.json`.

Render the film:

```bash
cd video
npm install
npm run render:crypto
```

Regenerate narration on Windows:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File video/scripts/tts-crypto.ps1
```

The script writes `video/public/audio/crypto/crypto-01.wav` … `crypto-06.wav`.

## Verification

Measured with the ffmpeg/ffprobe binaries bundled with Remotion:

- container duration: **57.877s**
- video: H.264, **1920×1080**, 30fps
- audio: AAC, **48 kHz stereo**
- decoded PCM: peak **0.518**, RMS **0.0596**; no silent narration segment
- Base Sepolia receipt: **status `0x1`**, block **49,311,297**
- wallet delta: **exactly −0.01 USDC** (18.87 → 18.86)
- no mainnet transaction, no mainnet signing path

## Files

| File | Description |
| --- | --- |
| `vanta-crypto-demo.mp4` | Final 1080p crypto cut, 7.1 MB |
| `crypto-poster.png` | Settlement frame poster |
| `crypto/approval.png` | Real paid-call approval card |
| `crypto/wallet-before.png` | Wallet before the run (18.87 USDC) |
| `crypto/wallet-after.png` | Wallet after the run (18.86 USDC) |
| `crypto/receipt.png` | Expanded paid step with `SETTLED 0.01 USDC` |
| `crypto/receipt-settled.png` | Receipt strip used in the film |
| `crypto/trace.png` | Execution trace with the paid step |
| `crypto/result.png` | Weather result returned to the user |
| `crypto/run.json` | Machine-readable capture + RPC receipt |

## Submission note

The Week 3 cut is hosted [on Google Drive](https://drive.google.com/file/d/1Xj1Vv1m76SJ_vCIX6gYc28-eO_zWdl0_/view).
The hosted file is 7,089,440 bytes with SHA-256 `b46175c6b7295fb695750542e344c1e66da3684bf7f386c4f26152b3ddeaf917`,
identical to `artifacts/demo/vanta-crypto-demo.mp4`. The separate Google Drive link for the Week 1 explainer is not this cut.
