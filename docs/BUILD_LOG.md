# VANTA build log

**Build window:** 2026-10-23 → 2026-10-24  
**Scope:** transform the existing Agentmaxxing/Maxx chat demo into VANTA, an observable agent workspace with hardened approvals, then give it a field-manual identity and a rendered explainer.

## Baseline (before changes)

- Next.js 16.3.8 App Router, React 19.3.0, TypeScript 5.9.3, Tailwind 4.3.3, shadcn/base-ui.
- One-page chat UI (`app/page.tsx`, 503 lines) plus `/api/agent`, `/api/wallet`, `/api/weather`, `/api/fortune`, `/api/research`.
- Gemini function-calling loop in `agent/agent.ts`; deterministic paid-tool intent gate in `agent/intent.ts`; 9 tools.
- x402 EIP-3009 testnet settlement in `lib/x402.ts` + `agent/wallet.ts`; SSRF-guarded crawler in `lib/web.ts`.
- **Critical finding:** the approval resume path accepted client-supplied `contents`/`steps` as proof of approval. A forged body could construct an “approved” resume turn. A mixed free+paid tool turn also incorrectly executed free calls on denial, and the pending call list included unpaid calls.
- No tests, no Playwright, no motion system, no product routes beyond `/`.
- `.env` already had a live Gemini key, testnet wallet and facilitator (values never printed).

## Implemented

### Security / agent core
- `agent/approvals.ts`: server-side approval registry. Opaque UUID, 5-minute TTL, pruned, single-use (deleted before execution), server-held model state, per-run budget and one paid approval per run.
- `agent/agent.ts` rewritten: measured step durations, sequenced events, plan updates, per-tool 45s timeout, transient 503/429 retry, budget enforcement, paid-call re-validation on resume, denial path that cannot execute a tool, correct mixed free/paid turns.
- First model call is constrained to the requested paid tool when the intent layer unlocks one, so a paid mission reaches the approval card instead of silently answering from free snippets.
- `app/api/agent/route.ts`: accepts only `{mission, history}` or `{approvalId, decision}`; bounded body/history/mission; rejects the old `resume` shape; rate limited; no-store.
- Research route now ranks real search hits by title relevance before crawling (fixes “agentic payments” returning only unrelated Wikipedia pages).

### Tools
- 7 new deterministic tools in `lib/toolkit.ts`: `calculate_expression` (hand-written parser, no eval), `convert_units`, `format_json`, `summarize_text` (extractive), `create_action_plan`, `check_url_safety` (no fetch), `compare_sources`.
- Registry is now 16 tools: 13 free, 3 paid. Each has typed JSON schema, honest limitations, execution kind and example.

### Product UI
- New routes with shared app shell: `/`, `/workspace`, `/tools`, `/activity`, `/settings`.
- Landing: hero, live/demo mission playground, five-scene scroll narrative, features, pricing, roadmap, browser-voice walkthrough, footer.
- Workspace: mission composer, real plan states, measured tool trace, event log, approval card with countdown and exact price/network, result + sources, wallet card, browser-local run history, budget/one-approval note, honest stop behaviour.
- Activity: browser-local audit ledger built from real runs, with a clearly labelled sample when empty.
- Settings: runtime readiness (booleans only), model, network, wallet, spend ceiling, config names, local data controls, security notes.
- Design system: near-black/warm-white/acid signal, indigo mesh, metric grid, mono metadata, accessible focus states, reduced-motion support.
- Motion: one Lenis + GSAP + `@gsap/react` lifecycle (`MotionProvider` + scoped `useGSAP`), staggered reveals, parallax, scroll-linked rail, nested-scroll prevention.
- Wallet UX: testnet label, real balances (formatted ETH), explorer link, refresh, no mainnet path.
- Demo fallback: no API key → deterministic planner executes real free tools and labels the run `demo`; no fake model/payment.

### Demo / QA
- `tests/toolkit.test.ts` + `tests/approvals.test.ts` (Node test runner).
- `e2e/smoke.spec.ts` + `playwright.config.ts`: routes, mobile overflow, free run, paid approval + denial.
- `scripts/demo/record.mjs` + `npm run demo:record`: real 1280×720 Chromium video and nine screenshots; exits non-zero on failure; optional `VANTA_DEMO_APPROVE=1`.
- `artifacts/demo/DEMO_SCRIPT.md`, `narration.txt`, screenshots, generated `vanta-walkthrough.webm`.

## Verified

| Check | Command | Result |
| --- | --- | --- |
| Unit/integration tests | `npm test` | **12 pass, 0 fail** |
| Typecheck | `npm run typecheck` | **pass** (no output) |
| Production build | `npm run build` | **pass** — 13 routes generated |
| Browser smoke suite | `VANTA_BASE_URL=… npx playwright test` | **4 pass** (desktop routes, mobile overflow, free run, paid deny) |
| Demo recording | `VANTA_BASE_URL=… npm run demo:record` | **pass**, 9 screenshots, no console errors, video **72.64s** |
| Forged resume | POST `{resume:{...}}` | **400** “A mission string is required.” |
| Unknown approval id | POST arbitrary UUID | **404** |
| Deny paid call | POST `{approvalId, decision:"deny"}` | **200 completed**; paid step result `denied:true`; no charge |
| Approval replay | POST same id again | **404** |
| Approve weather | testnet 0.01 USDC | **on-chain tx** `0x828eb05d…433cfa`; wallet USDC 19.18 → 19.17 |
| Approve research | testnet 0.10 USDC | **on-chain tx** `0xac991271…8aa836`; real findings returned (Wikipedia/HN) |
| Research relevance | paid research | source titles returned from crawled pages after relevance ranking |
| Mobile width | 390px on all five routes | scrollWidth = 390 (no overflow) |
| Landing screenshots | Playwright | reviewed; dev overlay disabled for clean captures |

The on-chain testnet transactions above are real Base Sepolia transactions; no mainnet transaction was made.

## Deployment

- **Not redeployed.** The existing Vercel project, domain and integration configuration were left untouched.
- Existing deployment URL remains in the README as a fallback and is marked not re-verified.
- No push, commit or deploy was performed.

## Remaining blockers / limitations

- Pending approvals are stored in server process memory. Safe (fail-closed) but not reliable across multi-instance/serverless invocations. Needs a shared store for production.
- No authentication or per-user data isolation in this demo. Do not connect a funded wallet.
- Run history and ledger are browser-local, not durable or account-synced.
- The 63.55s explainer is rendered and verified locally with an embedded local-TTS voiceover. A user-provided hosted copy is linked from the README; the verified master remains local. Browser Web Speech narration also remains available in-app with a transcript.
- The existing live Vercel deployment has not been verified or updated with this build.
- Model reliability depends on Gemini availability; transient 503s are retried three times, then surfaced truthfully.
- VANTA name/domain/trademark availability is unverified.

---

## 2026-10-24 — second pass: distinct identity + explainer

### Design
- Replaced the near-black/acid-lime look with an **operator's field manual**: bone paper (`#EDE7DB`), ink (`#14161A`), cobalt authorization (`#1B2BE0`), safety orange (`#FF4D12`).
- Switched type to Bricolage Grotesque (display), Public Sans (body), IBM Plex Mono (data) via `next/font`; updated tokens, focus states and reduced-motion rules.
- New stamped-cobalt logo/favicon and a printed top strip with the execution sequence.
- Rebuilt the landing page around a real **work order** and a printed **price list**, plus a field-notes table, a boundary contract, and an open-work ledger.
- Restyled the shared app shell, workspace, tools, activity, settings and wallet card; the approval card is now a receipt with a rotated authorization stamp.
- Fixed mobile navigation gaps and the wrapping top strip at 390px.
- Added the field-manual identity to the actual execution trace and approval surfaces, not just marketing.

### Explainer
- Downloaded and followed the **EveryInc/product-launch-video** Claude Code skill plus the official **remotion-dev/skills** best-practice skills.
- Captured the redesigned app at 1600×900 with deviceScaleFactor 2; added locator crops for trace, result, approval and sources.
- Wrote a six-scene storyboard; generated narration locally with Windows SAPI (`Microsoft Zira Desktop`) — no cloud TTS key.
- Built a Remotion composition (`video/`) with the real screenshots, burned-in captions, hard-cut field-manual transitions and scene audio timed to measured WAV durations.
- Rendered stills first and fixed a clipped plan paragraph, a trace/result collision, a blocked denial label, and a stale hardcoded `4 ms / 5 ms` overlay that no longer matched the new run.
- Final film: `artifacts/demo/vanta-explainer.mp4` — **63.55s**, **1920×1080**, 30fps, H.264 + AAC stereo 48kHz, **6.8 MB**.

### Verification (new pass)
| Check | Command | Result |
| --- | --- | --- |
| Unit/integration tests | `npm test` | **12 pass, 0 fail** |
| Typecheck | `npm run typecheck` | **pass** |
| Production build | `npm run build` | **pass**, 13 routes |
| Browser smoke suite | `VANTA_BASE_URL=… npx playwright test` | **4 pass** |
| Mobile overflow | 390px, five routes | **no overflow** |
| Demo capture | `VANTA_BASE_URL=… npm run demo:record` | **pass**, 2× screenshots, no console errors |
| Explainer stills | `npx remotion still …` | six scenes rendered and visually reviewed |
| Explainer stream | `ffprobe` | video **H.264 1920×1080/30fps**, audio **AAC 48kHz stereo**, duration **63.552s** |
| Explainer audio | decoded PCM RMS | peak **0.548**, RMS **0.059**, **38.5%** audible samples; all 8 segments contain voice |

### Repository / deployment
- **No commit and no push were made.** The user held the push.
- The existing Vercel deployment was **not redeployed**.
- The video artifact and its Remotion source are present locally under `artifacts/demo/` and `video/`; the README links the user-provided Google Drive copy as the hosted watch link.

### Still open
- Durable/shared approval store, authentication, per-user isolation, server-backed history.
- The Google Drive copy is the only hosted cut; no YouTube/Loom upload was made. The voice is local desktop TTS, not a studio recording.
- Existing Vercel deployment remains unverified against this build.

---

## 2026-10-24 — third pass: brand kit, proof section, cleanup

### Cleanup
- Removed the concurrent session-replay integration completely: browser entry, controller module, consent UI, route bridge, offline fixture, documentation, package dependency, test script, environment variable block and replay-only `data-sensitive` attributes.
- `npm ls` shows no replay package and `package-lock.json` has no replay entry. No analytics, session-replay or telemetry package remains.

### Brand kit
- Added `/brand`: a public press page with download links, X-specific guidance, palette, type specimens and real product captures.
- Built three HTML artboards and rendered them with Playwright at 1× and 2×: X profile (400/800), X header (1500/3000), social card (1200/2400), plus a 180 px Apple touch icon.
- Added horizontal logo SVG, mark SVG, `BRAND.md` usage/palette/type notes, three product captures, and a single `vanta-brand-kit.zip`.
- Added Open Graph and Twitter image metadata pointing at the social card; added brand and film links to the site footer.
- Added a landing-page proof section with the real approval card, measured trace and crawled sources, presented as printed evidence.
- Documented `npm run brand:assets` for reproducible regeneration.

### Verification (third pass)
| Check | Command | Result |
| --- | --- | --- |
| Brand assets | `npm run brand:assets` | **pass** — 400/800 profile, 1500/3000 header, 1200/2400 social card, 180 icon |
| Brand assets | ZIP inspection | **12 entries** — marks, PNGs, product captures, `BRAND.md` |
| Replay cleanup | reference scan + `npm ls` | **no analytics or session-replay code/dependency remains** |

### Week 3 crypto demo

- Captured a real approved weather mission against the local production build: `get_weather`, Mumbai, **0.01 USDC** on Base Sepolia.
- Transaction: [`0x9b376282…52f9`](https://sepolia.basescan.org/tx/0x9b376282b627a2d8cadb0a05a770dbbedfa16dfe9b670a8c8802784c7a7352f9) — block **49,311,297**, status **`0x1`**, gas **85,788**. The receipt was independently checked with `eth_getTransactionReceipt` on `https://sepolia.base.org`.
- Wallet: `0xDa83…bAfe`, **18.87 → 18.86 USDC**. The delta is exactly the tool price.
- Fixed a visible wallet copy bug found in the capture: the Ethereum Sepolia hint rendered the balance token twice.
- Added `scripts/demo/crypto-run.mjs` (`npm run demo:crypto`) to drive the approval, capture the receipt, read the wallet before/after and verify the chain receipt.
- Built `VantaCryptoDemo` in the existing Remotion project with six scenes: wallet hook → account → approval → x402 settlement → before/after proof → close.
- Generated six local-TTS WAVs at `video/public/audio/crypto/`, timed the scenes to them and rendered **57.88s**, **1920×1080**, 30fps, H.264 + AAC stereo.
- Decoded PCM check: peak **0.518**, RMS **0.0596**; every scene contains narration.
- Final artifact: `artifacts/demo/vanta-crypto-demo.mp4`; poster `artifacts/demo/crypto-poster.png`; proof captures in `artifacts/demo/crypto/`; shot list in `artifacts/demo/CRYPTO_DEMO_SCRIPT.md`.

### Final verification (third pass)

| Check | Command | Result |
| --- | --- | --- |
| Unit/integration tests | `npm test` | **12 pass, 0 fail** |
| Typecheck | `npm run typecheck` | **pass** |
| Production build | `npm run build` | **pass**, 15 pages (14 routes + not-found) |
| Browser smoke suite | `VANTA_BASE_URL=… npx playwright test` | **6 pass** (routes, mobile, brand downloads, crypto proof/video, free run, paid denial) |
| Brand assets | `npm run brand:assets` | **pass** — 400/800 profile, 1500/3000 header, 1200/2400 social card, 180 icon |
| Brand ZIP | archive inspection | **12 entries** |
| Crypto capture | `npm run demo:crypto` | **pass**, real 0.01 USDC testnet settlement |
| Crypto video | Remotion render + ffprobe | **57.877s**, H.264 1920×1080/30fps, AAC 48 kHz stereo |
| Crypto receipt | Base Sepolia RPC | **status `0x1`**, block **49,311,297** |
| Replay cleanup | reference scan + `npm ls` | **no analytics or session-replay code/dependency remains** |
| X frames | `npm run social:assets` | **10 × 1600×900** PNGs; copy counts **161–226 / 280** weighted characters |

### Push status

- **Pushed.** `main` matches `origin/main`; the working tree is clean.
- The remote had gained `BUILD_PROMPT_VANTA.md` after this branch was cut, so the local commit was rebased onto `origin/main` before pushing.
- GitHub render checked: the README title, banner image, relative Markdown targets across the docs, `SUBMISSION.md`, the demo MP4 page and the 7,089,440-byte raw download all resolve.
- The existing Vercel deployment was **not redeployed**.
- The Week 3 crypto MP4 is committed, downloadable from GitHub and hosted on [Google Drive](https://drive.google.com/file/d/1Xj1Vv1m76SJ_vCIX6gYc28-eO_zWdl0_/view). The hosted file is 7,089,440 bytes; its SHA-256 matches the committed master.

### Submission links

- Active X account: <https://x.com/vantanss7>.
- The 10-post X launch kit, 1600×900 frames and alt text live in `artifacts/social/`; see `X_CONTENT_PLAN.md`.
- The Week 3 crypto demo now has a public watch link; the Vercel deployment is still the only outstanding submission item.
