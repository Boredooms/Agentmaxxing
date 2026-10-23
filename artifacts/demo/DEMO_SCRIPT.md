# VANTA explainer — storyboard and capture notes

**Final runtime:** 63.55 seconds · **Format:** 1920×1080, 30fps, H.264 + AAC stereo 48kHz  
**Voice:** local Windows SAPI (Microsoft Zira Desktop) · **Music/SFX:** none  
**Final artifact:** [`vanta-explainer.mp4`](vanta-explainer.mp4) · **Poster:** [`explainer-poster.png`](explainer-poster.png)

The film is built from real screenshots of the running app. The paid path shown is a **denial**, so no settlement or on-chain transaction is depicted or claimed.

## Storyboard

| # | Time | Scene | Visual | Narration |
|---|------|-------|--------|-----------|
| 1 | 0:00–0:07.2 | The problem | Bone field-manual title over the real landing page; product appears in a browser frame | "Most agents ask for your trust. VANTA shows you the work." |
| 2 | 0:07.2–0:20.7 | The plan | Real workspace screenshot + auditable checklist notes; "no timer theatre" stamp | "Give it a mission. Before the model sees a toolbox, VANTA classifies the request and writes a plan…" |
| 3 | 0:20.7–0:32.1 | The trace | Real execution trace and result cards with measured durations | "Real tools run. You see the arguments, the payload, and the measured duration…" |
| 4 | 0:32.1–0:47.1 | The boundary | Dark ink scene; real approval card, exact 0.01 USDC / Base Sepolia / single-use labels | "When a tool costs money, the loop stops… Deny it, and the paid tool never runs." |
| 5 | 0:47.1–0:55.9 | The evidence | Real result + three real source URLs; provenance statement | "The answer carries receipts. Real source URLs, and a testnet settlement when you approve." |
| 6 | 0:55.9–1:03.5 | Close | Cobalt end card, logo, repo, testnet label, barcode | "VANTA. Give it a job. Keep the receipts." |

## Reproduce the UI captures

```bash
# terminal 1
npm run dev

# terminal 2 — use the port Next prints
VANTA_BASE_URL=http://localhost:3000 npm run demo:record
```

This writes the 2× screenshots used by the video, the full-page evidence, and a real browser `.webm` (ignored by git). It exits non-zero on failure and reports browser console errors.

The optional `VANTA_DEMO_APPROVE=1` flag approves exactly one testnet call instead of denying it. The committed explainer was rendered from the **deny** capture.

## Reproduce the explainer

```bash
cd video
npm install
npm run render
```

The Remotion source, WAV narration and 2× screenshots are committed in [`video/`](../../video/). `npm run render` writes `video/out/vanta-explainer.mp4`.

Narration can be regenerated on Windows with:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File video/scripts/tts.ps1
```

## Verification

Measured with the ffmpeg/ffprobe binaries bundled with Remotion:

- container duration: **63.552s**
- video: H.264, **1920×1080**, 30fps
- audio: AAC, **48kHz stereo**, 63.552s
- audio energy: peak **0.548**, RMS **0.059**, **38.5%** of samples above 0.01; all eight time segments contain voice (no silent track)
- no hosted YouTube/Loom URL is claimed

## Files

| File | Description |
|------|-------------|
| `vanta-explainer.mp4` | Final 1080p explainer, 6.8 MB |
| `explainer-poster.png` | Hook frame used as poster |
| `01-landing.png` … `09-settings.png` | Captured product screens (2×) |
| `04b-result-card.png`, `04c-trace-card.png`, `05b-approval-card.png`, `06b-result-card.png`, `06c-sources-card.png` | Locator crops used in the film |
| `narration.txt` | Exact voiceover script |
| `vanta-walkthrough.webm` | Longer raw browser walkthrough (generated, gitignored) |
