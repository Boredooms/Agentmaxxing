# VANTA — Agentmaxxing End-to-End Product Transformation Prompt

> Paste this entire prompt into your coding agent (Codex / Claude Code / Cursor / OpenCode) while the working directory is the existing repository. Enable its repository, terminal, browser, and available skills/tools. This is an implementation assignment, not a request for another plan.

## ROLE AND EXECUTION CONTRACT

You are the autonomous staff engineer, product designer, agent-systems engineer, QA engineer, and demo producer for this repository. Work directly inside the existing checkout: https://github.com/Boredooms/Agentmaxxing.

**Deliver a functioning and demonstrable product in the next 60 minutes.** Begin immediately by inspecting the repository and runtime. Do not stop after a plan, do not return just wireframes, and do not ask me to choose between options. Make sensible decisions and implement the best vertical slice first. Use parallel subagents only if your execution environment supports them and they reduce elapsed time; assign independent, bounded tasks and verify their output yourself.

A deadline is not permission to fake capabilities. Prefer a smaller end-to-end product that works over a huge mock. Do not say deployment, payment, video rendering, voice, authentication, or tests succeeded unless you verified the result.

At the start:
1. Inspect README.md, package.json, lockfile, .env.example, all app routes, agent/agent.ts, agent/intent.ts, agent/tools.ts, agent/wallet.ts, lib/x402.ts, lib/web.ts, current UI components and Vercel deployment configuration.
2. Run git status --short, inspect recent commits and existing changes; preserve all user work. Never reset, force-push, expose secrets, or discard user modifications.
3. Inspect the live deployment and browser-check its current state if browser tooling is available. Record a short baseline of what works/breaks.
4. Check current official docs and the exact installed/package versions before changing dependencies. Reuse what is already installed.
5. Immediately begin implementing; write a brief checklist to docs/BUILD_LOG.md and update it as real progress occurs.

## PRODUCT: VANTA

Rename the user-facing product from Agentmaxxing/Maxx to **VANTA** (working name; use this consistently in product UI and metadata, while retaining challenge/starter attribution in README credits). Do not rename the GitHub repository, Vercel project, or domain automatically. Do not claim the VANTA name/domain/trademark is legally available; availability must be checked separately.

**Positioning:** VANTA is an observable autonomous work agent that takes a user’s goal, plans actions, uses real tools, shows evidence/results, and asks for permission before spending money or executing consequential actions. Its standout differentiator is a visible execution trace and budget-aware, human-supervised agentic payments—not another generic AI chat UI.

**Tagline:** “Give an agent a mission. Watch it get the work done.”

Primary use case for the demo: “Research the current state of agentic payments, compare several sources, and prepare a concise cited briefing. Show me each step and ask before using a paid tool.” The real running agent must select tools, execute calls, display inputs/outputs, surface sources, request approval for paid work, and continue after approve/deny. Use a free-only example too.

## CRITICAL STARTING-REPO FACTS

This is not an empty starter:
- Next.js App Router, React, TypeScript, Tailwind CSS v4 and shadcn component setup already exist.
- @google/genai implements a Gemini model-driven tool loop in agent/agent.ts.
- agent/intent.ts deterministically gates paid tools before the model sees the tool declarations.
- agent/tools.ts currently includes free tools and paid weather, fortune and research tools.
- agent/wallet.ts and lib/x402.ts contain viem/Base Sepolia wallet and a payment flow that the README describes as EIP-3009 on-chain USDC settlement.
- Existing API routes include /api/agent, /api/wallet, /api/weather, /api/fortune, and /api/research.
- The UI is presently centered on a chat and setup/tools panels.
- Existing Vercel deployment already exists. Preserve it and avoid changing its project/domain/integration configuration unless required and explicitly safe.
- Current manifest includes the Next.js 16, React 19, TS 5.9, Tailwind 4, shadcn, lucide-react, viem and Gemini SDK family. Confirm exact lockfile-resolved versions; don't blindly upgrade the stack.

First validate that the README's claims match the actual implementation. Fix dangerous or incorrect behavior before extending it. In particular, inspect the approval/resume path carefully: the server must never trust client-supplied serialized model/tool state as proof of a valid approval, nor allow an arbitrary client to construct an “approved” resume payload and cause paid tool calls. Bind pending approvals to a server-validated short-lived state/token, validate tool names/arguments/price and original turn intent again on resume, reject expired/replayed approvals, and make denial incapable of calling the paid tool. Keep this change small, test it, and don't leak wallet private keys or facilitator secrets. Preserve the existing SSRF protections and host allowlists in research/crawl code.

## 60-MINUTE ORDER OF OPERATIONS (FOLLOW THIS ORDER)

### Minutes 0–5 — reconnaissance and baseline
- Inspect all core files and run the existing build/typecheck/test scripts if available.
- Check environment availability without printing secret values. Identify missing keys without blocking free/demo-safe functionality.
- Record current route/API/UI architecture and deployment state in docs/BUILD_LOG.md.
- Write down the highest-value blocker and fix it first.
- Do not dump secrets in logs or screenshots.

### Minutes 5–20 — build the real product shell
Create a premium product experience in the current app with a deliberate IA and working route/navigation:
- / : cinematic marketing/product page with an embedded, interactive VANTA playground.
- /workspace : real agent console with mission input, run state, tool events, approvals, result/artifact view, and run history.
- /activity : ledger/audit trail of tool runs, payment approval/denial, errors, and settlement receipts, using real available data or clearly labeled local demo seed data.
- /tools : real registered tools catalog with schemas/descriptions/costs and free/paid classification.
- /settings : runtime readiness, active model, API key status as booleans only, wallet address/balance, network/testnet label, spending limits where implementable. Never display secrets.
Do not add heavy routing abstractions when basic Next App Router pages suffice. Use a shared app shell, responsive sidebar/topbar, cohesive components and empty/loading/error states. Every visible nav item and primary CTA must work.

### Minutes 20–38 — implement the vertical-slice agent
Keep and improve the existing Gemini loop rather than replacing it with mocked responses. Build a coherent typed run/event model and the following capabilities:
- **Mission planner:** produce a short, explicit plan/checklist; track pending/running/succeeded/failed/awaiting-approval states. When time is tight, implement deterministic plan framing around the existing Gemini loop instead of a second LLM call.
- **Real tool registry:** expose existing tools accurately. Add at least five genuinely new core tools beyond the current default set if this remains a Week 1 submission, unless the work clearly upgrades into the project-idea/product submission track. Suggested easy, useful additions: summarize_text (local deterministic summary scaffolding or LLM-free extractive summary), convert_units (validated deterministic conversion), calculate_expression (safe parser; never eval), format_json (parse/reformat/validate), create_action_plan (structured task checklist). Also consider check_url_safety (only validate URL syntax/domain scheme; do not fetch arbitrary destinations), and compare_sources based on already-fetched source records. All tools require argument validation, explicit descriptions, typed results, visible UI events and tests. Don't count cosmetic tools or mocked integrations as real tools. Never use eval or execute user-provided code.
- **Execution trace:** each tool call shows step number, status, duration if actually measured, arguments, result and error; make the trace collapsible and accessible. Never invent latency, token counts, successful results, or transaction hashes.
- **Source-backed research:** preserve SSRF defense; show real source titles/URLs and excerpts. Never create fake citations.
- **Human approvals:** paid tools display clear name, reason, exact price/network, tool arguments and approve/deny actions. Keep the existing testnet x402 path if it passes verification. Add a per-run max spend / cancellation guard if straightforward. For ordinary turns, make it impossible for the model or user text to unlock paid tools unless intent policy permits it.
- **Wallet/payment:** show clear “Base Sepolia · TESTNET” status, balance and explorer link when real data is returned. Do not introduce mainnet spending. Never execute a paid operation until server-side verification accepts the specific approval and payment.
- **Persist run history** using a small, Vercel-compatible solution. If no durable DB is configured, use client-side/local storage for UX history and clearly label it “This browser”; never imply it is account-synced or durable server storage. Do not add a new paid database dependency for this one-hour build.
- **Demo-safe mode:** when secrets are unavailable, free deterministic tools and a clearly labeled sample walkthrough must still be usable. Visibly differentiate “Live” vs “Demo” data. Demo mode must not fabricate a payment/transaction success or impersonate an actual live model call.

Aim to demonstrate a real useful workflow that includes free tools and optionally a paid tool if credentials/funds/network allow it. Test with missing-key and tool-error behavior.

### Minutes 38–49 — impeccable front end and motion
Use the current stack and build a distinctive visual system rather than generic dashboard cards:
- Design language: black/near-black backgrounds, warm-white high-contrast typography, grayscale surfaces, very restrained acid-lime signal color, soft indigo/charcoal mesh gradients, thin gridlines, generous whitespace, expressive display headings and refined monospace for logs/metadata.
- No rainbow gradients, overdone glassmorphism, tiny illegible type, neon-everywhere, filler metrics, fake logos or endless identical cards.
- Keep content legible at 100% zoom; body text normally at least 14–16 px, metadata not smaller than readable 12 px, visible keyboard focus, reduced motion, proper semantic landmarks, useful empty states, and responsive layouts. Avoid horizontal overflow on mobile.
- Use existing shadcn components first and add components as needed using official CLI/docs only after verifying current project configuration. Use lucide-react icons consistently.
- Create reusable design tokens in the existing Tailwind/CSS system. Preserve existing Tailwind 4/shadcn config.
- Landing page sequence: compact navbar and product identity; memorable headline + clearly visible CTA; interactive agent command/demo panel; a scroll-linked “intent → plan → tool → approval → result” product narrative; live workspace preview tied to real state or clearly labeled sample; features/security section; pricing/pay-as-you-go explanation; roadmap/challenge info; clean footer.
- Avoid loading a huge stock video in the hero. Prefer lightweight CSS/SVG visuals, a real app interaction, and subtle animated process graph.
- Respect reduced-motion; disable expensive pinning/parallax on mobile/low-power. Motion must never obscure text, block interaction, or impair access.

**Motion libraries**: install/use lenis, gsap, @gsap/react only if not already available, and confirm license/docs. Integrate Lenis and GSAP ScrollTrigger through one shared client-side motion provider with one lifecycle:
  - sync Lenis scroll events into ScrollTrigger.update;
  - drive Lenis from GSAP ticker (or use the official current integration), remove listeners/ticker and destroy Lenis on unmount;
  - register plugins and use useGSAP scoped contexts so React unmounts don't leave duplicate triggers;
  - implement only a few high-quality triggers: hero text reveal, step-by-step product story with scroll progress, staggered feature reveal, a gentle background/graphic parallax.
  - ScrollTrigger.refresh() after layout-changing content/assets where needed.
  - Disable/reduce motion for prefers-reduced-motion: reduce.
  - Do not use several competing smooth-scroll implementations. Native scrolling must still be possible and usable in nested scrollable panels.
Use official integration references: Lenis GitHub docs https://github.com/darkroomengineering/lenis and GSAP ScrollTrigger docs https://gsap.com/docs/v3/Plugins/ScrollTrigger/ and @gsap/react https://www.npmjs.com/package/@gsap/react.

### Minutes 49–55 — voice/video and product demo
Implement the highest-reliability demo pipeline available in the current environment:
1. Add a scripted browser walkthrough using Playwright. It must run against the local product and capture a real browser video at a fixed 16:9 viewport; create helpful screenshots as evidence. Exercise the most important path: landing page → workspace → free task → inspect tool event → trigger a paid-tool approval → deny safely OR approve only when testnet creds and budget are configured → inspect result/audit trail.
2. Save recording artifacts under artifacts/demo/ (ensure large binaries aren't accidentally committed unless repo policy expects them). Create artifacts/demo/DEMO_SCRIPT.md with the storyboard, narration, steps and duration target of ~60–90 seconds.
3. If installed/browser permissions allow, create a short voiceover via browser speech synthesis or a configured TTS API. Preferred optional integration: ElevenLabs only if an API key already exists; otherwise use built-in Web Speech/browser narration where it actually works, or provide narration.txt plus a reproducible local TTS instruction. Do not ask for a new secret as a blocker. Never claim TTS worked unless an audio file was produced and checked.
4. Optional premium cut: use Remotion only if it can be installed/rendered in the remaining time without endangering the working app. Produce a title/end card, kinetic captions, and subtle motion around real captured footage; do not replace working UI footage with an unrelated synthetic mockup.
5. Capture, review and fix at least the opening and main workflow screenshots. Ensure narration doesn't claim features not present.
6. If a video cannot be rendered under time/environment limits, still ship a functioning Playwright capture script, storyboard, narration file, and exact commands; disclose what remains unrendered. Do not fabricate a hosted YouTube/Loom URL. Put the future demo URL placeholder into the README and clearly state “recording needs publishing” until uploaded.

### Minutes 55–60 — verification, README, deployment readiness
- Run npm run build and any typecheck/lint/test scripts that already exist. Add a minimal test if the repository has no test setup and time permits.
- Fix blockers caused by our code. If a full production build exceeds the window, report its status honestly.
- Use the current browser automation to smoke-test the responsive UI and key flows.
- Check git diff --check, inspect git status, make sure no secrets, private keys, local env files, or large unintended artifacts are in the diff.
- Do not push/deploy without permission unless this execution environment has already been explicitly configured for that action. If deploy is authorized and Vercel CLI/connection is available, use a safe preview deployment first, then verify its URL; preserve the production domain.
- Update README comprehensively and truthfully. Create/update a logo SVG with a VANTA mark if time allows.
- Summarize implemented files, test commands/results, live URL status, what really works, missing secrets, and remaining TODOs in docs/BUILD_LOG.md.

## REQUIRED UX DETAILS

### Workspace layout
- Left nav: Overview, Workspace, Tools, Activity, Settings.
- Main mission header: “What should VANTA accomplish?” with multi-line mission input, example chips and Run button.
- Execution status panel with current step and progress based on real step events, not arbitrary timer animations.
- Plan list with queued/running/complete/blocked states.
- Run timeline/tool inspector with actual event payloads.
- Right or bottom detail panel for results and source citations.
- Approval card emphasizes the tool, exact price, network, why it is requested, parameters and two unambiguous actions.
- Wallet mini-card shows testnet/network and actual address/balances when available; include a clear refresh action.
- Provide Cancel/Stop behavior that actually aborts cancellable work, or explicitly show that a current tool is non-interruptible.
- Keyboard support: submit mission, focus controls, escape/close modal, no keyboard traps.

### Homepage motion
- Use a single carefully composed hero statement such as “Not another chatbot. A worker with tools, receipts, and boundaries.”
- Animated, scroll-linked execution sequence showing:
  1. Intent recognized (free/paid classification)
  2. Plan created
  3. Real tool selected and run
  4. Paid action blocked pending approval
  5. Evidence/result returned
- Use a dark, restrained mesh gradient with a subtle dotted grid and abstract vector/orbit/flow visualization. Do not use huge client-side WebGL or heavy 3D packages in this deadline.
- Add honest “Live agent”/“Interactive demo” labels.
- Keep links to GitHub and the current deployed application until a replacement deployment is successfully verified.

## NEW TOOLS: REQUIREMENTS

Every addition must be a real deterministic function or a real external/API operation—not an LLM claim or hardcoded success:
- calculate_expression: support only an allowlisted grammar of numeric literals, parentheses and arithmetic operators; use a well-tested parser library if possible or write a tiny recursive-descent parser. Reject identifiers, property access, function calls and malformed expressions. Never use eval/Function.
- convert_units: support a documented allowlist of common units and dimensions; reject incompatible dimensions; return source/target/value and exact conversion.
- format_json: JSON.parse only, then JSON.stringify with pretty formatting; report syntax errors without echoing secrets.
- summarize_text: implement transparent deterministic extractive summary for no-key fallback (sentence scoring/frequency or user-configured length), and optionally allow Gemini summarization as a separate clearly labeled mode. Do not claim deterministic output is an LLM summary.
- create_action_plan: transform user steps into a validated structured checklist; don't automatically run the generated plan. Mark generated suggestions vs completed actions clearly.
- optional compare_sources: compare only actual passed/fetched sources using URL/title/excerpt and distinguish common claims, disagreements and gaps without inventing citations.
- optional check_url_safety: syntax/scheme/hostname validation only. Do not fetch arbitrary targets or weaken current SSRF defenses.

Test valid, invalid and edge-case inputs. Update the tools catalog and README with actual names and accurate behavior. If the Week 1 requirement applies, make sure at least five genuinely new core tools are implemented and callable by the agent.

## PAYMENTS, SAFETY AND SECURITY

- Default only to Base Sepolia/testnet. Never silently switch to mainnet.
- Preserve server-side secret handling; keys stay in server environment and never enter prompts, public endpoints or logs.
- Keep spending approval human-visible. Verify user approval and payment demand server-side for each pending paid action. Apply per-tool/per-run spending budgets and expiry if feasible.
- Do not allow user-provided resume JSON to prove prior authorization. Prefer opaque, signed or server-stored pending-run tokens and a server-side record. Reject replayed/expired/mismatched decisions.
- Validate input JSON and bound payload length/history/maximum steps, use request timeouts, rate limits and safe error messages.
- Preserve the crawler host allowlist/private-address blocking, DNS validation and redirect re-validation. Never fetch localhost/private IPs or user-supplied arbitrary URLs through server-side routes.
- Do not write sensitive queries, private keys, signatures, or raw credentials to browser localStorage/audit trail.
- Do not make irreversible transactions or deploy contracts; the demo uses testnet only.
- Clearly label mock/demo data, testnet values and live API availability.
- Add a concise security note in README.

## VOICE AND INTERACTIVE VIDEO REQUIREMENTS

The landing experience should have an optional “Listen to the walkthrough” control:
- Use native Web Speech API for browser-side narration when supported, with play/pause/stop and clear unavailable-state message.
- Don't assume speechSynthesis exists during SSR; access it only on the client and handle unsupported browsers.
- Synchronize narration with the 5 execution-sequence scenes using timed word/scene transitions only where reliable; cancel speech on navigation/unmount.
- Do not autoplay sound. Provide captions/transcript.
- Keep voice demo optional and never gate core functionality on it.
- Playwright must record the actual responsive UI and test interactions; don't create a fake “video” element with a static placeholder and call it a demo.
- Write a repeatable command, e.g. npm run demo:record, after adding Playwright and its config. The command should report the output path and exit nonzero on failure.

## LIBRARIES AND DEPENDENCY RULES

Use this stack unless inspection demonstrates a genuine blocker:
- Current Next.js App Router, React, TypeScript, Tailwind v4, shadcn/ui and lucide-react.
- lenis + gsap + @gsap/react for site scroll/motion.
- @playwright/test for browser smoke tests/video recording.
- Optional Remotion only for a rendered editorial cut if there's time.
- Optional ElevenLabs only when an already-configured API key is available; native browser speech is the zero-secret path.
- Use pnpm/npm consistent with the existing package lock. Keep the lockfile synchronized with dependency changes.
- Check peer dependencies and documentation for the exact version before install; don't use stale copied setup or add a library just for brand signaling.
- Avoid giant animation frameworks, multiple simultaneous smooth scrollers, unnecessary databases, and dependency bloat.

## README — MANDATORY FOR SUBMISSION

Update README.md so it no longer represents the product merely as a starter kit. It must include:
1. Product logo
2. Product name and concise description
3. Problem the agent solves, target use case and differentiator
4. Tech stack with actual resolved version numbers
5. Actual list of all supported agent tools, grouped by free/paid and indicating limitations
6. Supported AI models with exact model IDs and truthful current status; distinguish verified from merely configurable. Explain switching if supported.
7. Key features and architecture diagram (Mermaid is fine)
8. Demo video section with “Week 1 (vanta.v1): <published demo URL or ‘recording pending — see artifacts/demo/’>” and analogous version rows only when meaningful. Never invent a URL.
9. Demo link using the verified live URL; don't point to a broken or unverified domain. Keep current Vercel URL as fallback until a new deployment is confirmed.
10. Future scope for Week 2/3 (e.g. ZK spend attestations, safer spending policies, agent-to-agent x402 purchases, additional tool packs, persistent run history, model switching) clearly separated from implemented features.
11. Social media: product X page currently https://x.com/nightproof67 is the supplied account. Don't rename/create X handles automatically or claim a new product page exists. Mention the intended product handle as pending until actually created; include @riseinweb3/tagging submission guidance.
12. Local setup, environment-variable names (never values), scripts, Vercel deployment steps, limitations and security notes.
13. Clearly mark live vs demo-only capabilities, and include screenshots from actual app if feasible.
14. Preserve relevant challenge acknowledgement/credits without letting it dominate the product story.

## DEFINITION OF DONE

A successful implementation is not “the code looks impressive”. Before concluding, prove as many of these as environment permits:
- Product naming/visual identity updated end-to-end.
- Homepage and workspace have responsive, working primary interactions.
- Agent still makes real Gemini function/tool calls with traceable inputs/outputs.
- At least five newly implemented tools exist and are callable (when Week 1 requirement applies).
- Paid intent gating remains server-side and is tested.
- A malicious/forged/expired/replayed approval cannot execute a paid tool; denial does not execute it.
- Research results show real sources without disabling SSRF protections.
- Wallet and payment statuses are truthful; testnet is explicit.
- Lenis/GSAP ScrollTrigger have lifecycle cleanup and reduced-motion behavior.
- Native voice is optional, accessible and does not autoplay.
- Browser smoke test and real browser video-recording script exist.
- npm run build passes, or the precise blocker is documented.
- README satisfies every required submission section.
- No secrets/private keys/local env files accidentally committed.
- Build log distinguishes implemented, tested, deployed, recorded and pending work.

## FINAL RESPONSE FORMAT

At the end, report only facts:
1. Implemented — concrete user-visible and agent capabilities.
2. Verified — exact build/test/smoke commands and results.
3. Demo artifact — exact relative path, duration if recorded, and any audio availability.
4. Deployment — verified URL/status only; otherwise state it was not redeployed.
5. Remaining blockers — missing secrets, unavailable APIs, or anything not completed within the hour.

Start now. Inspect first, then implement. Do not stop after writing this plan.
