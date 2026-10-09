<p align="center">
  <img src="public/logo.svg" width="180" alt="Agentmaxxing logo — a robot holding a USDC coin"/>
</p>

# Agentmaxxing 🤖💰

**Maxx** — an AI agent with its own crypto wallet, built with the [agentmaxxin](https://www.npmjs.com/package/agentmaxxin) starter kit for the **Agentmaxxing × Rise In Week 1** challenge.

Maxx is powered by Google Gemini, decides for itself which tools to call, and when an API costs money it **signs the payment from its own wallet** (x402 pattern) without asking anyone. You can watch every tool call and every signed payment in the chat UI.

- 🌐 **Live app:** https://agentmaxxing-boredooms-projects.vercel.app
- 💻 **Repo:** https://github.com/Boredooms/Agentmaxxing

## The problem it solves

AI agents today are boxed in by two walls: they can't **pay for things on their own** (every useful API sits behind an account, an API key, a checkout page) and they can't be **trusted with money** (no way for a human to supervise machine spending). Maxx removes both walls:

- **An agent that pays per request, with no accounts:** Maxx holds a real (testnet) wallet and settles per-request payments on-chain with x402 — an API just replies `402 Payment Required`, and Maxx signs and pays it. No API keys, no subscriptions.
- **A human stays in charge:** every paid tool call pauses and pops an approval card — nothing is signed until you hit *Approve & pay*. This is the trust model agents need before anyone hands them a real balance.

## What Maxx can do (tools)

| Tool | What it does | Costs? |
| --- | --- | --- |
| `get_weather` | Live weather for any city (geocoding + current conditions from open-meteo.com), paid via on-chain settlement at `/api/weather` | 0.01 USDC, auto-paid on-chain |
| `get_fortune` | A secret degen fortune reading (paid API at `/api/fortune`, built by me) | 0.05 USDC, auto-paid on-chain |
| `research_web` | **Deep research**: searches multiple sources, crawls the top pages through an SSRF-guarded crawler, extracts their text, returns structured findings with sources | 0.1 USDC, auto-paid on-chain |
| `get_my_wallet` | The agent's address + ETH and USDC balances (reads Base Sepolia, and Ethereum Sepolia for stranded faucet funds) | free |
| `web_search` | Quick web search — Wikipedia + Hacker News via free JSON APIs | free |
| `get_crypto_price` | Live crypto prices via the free CoinGecko API | free |
| `get_country_info` | Capital, population and region of any country (REST Countries) | free |
| `get_joke` | A random joke (Official Joke API) | free |
| `roll_dice` | Rolls a cryptographically secure dice 🎲 | free |

**9 tools total** — 3 of them are self-built paid APIs settled on-chain (weather, fortune, research), 6 free.

## Supported AI models

Maxx runs on Google Gemini through `@google/genai`. The model is **switchable** via the `GEMINI_MODEL` environment variable — any Gemini model your API key can access works:

| Model | Status |
| --- | --- |
| `gemini-flash-lite-latest` | ✅ Pinned in the deployed instance (verified live end-to-end) |
| `gemini-flash-latest` | ✅ Supported — the kit's default (was returning 503 high-demand on fresh keys during Week 1) |
| `gemini-3.8-flash` | ✅ Supported (same 503 window during testing; works when demand settles) |

Older Gemini 2.x models are retired for new API keys, so the list above reflects what current keys can actually call.

## Key Features

- 🤖 **A real agent loop, not a chatbot**: model → tool calls → results → model, until it answers in text — every step visible in the UI's tool inspector.
- 💸 **An agent with its own wallet**: viem-generated EOA on Base Sepolia holding ETH for gas + USDC for spending; the wallet panel shows live balances.
- ⛓️ **Real x402 settlement, not an IOU demo**: EIP-3009 `TransferWithAuthorization` signed by the agent, verified and submitted on-chain by a facilitator wallet — with the basescan tx hash linked from the UI.
- 🙋 **Human-in-the-loop payments**: paid tool calls pause the loop and pop an approval card (tool, args, price); *Deny* flows back to the model so it answers gracefully without the data.
- 🔬 **Deep research with citations**: search → SSRF-guarded crawl → structured findings → model-synthesized answer with sources.
- 🧠 **Token-window chat memory**: rough ~6k-token window (newest wins) keeps long chats inside budget.
- 🛡️ **Hardened**: SSRF-guarded crawler (host allowlist + DNS private-range rejection), per-IP and per-payer rate limits with `429`/`Retry-After`, payment replay protection.

## Demo Video

**Week 1 (agentmaxxing.v1):** _[paste your demo video link here — YouTube/Loom]_

- 🌐 Live app: https://agentmaxxing-boredooms-projects.vercel.app
- 💻 Source: https://github.com/Boredooms/Agentmaxxing

## Tech Stack (with versions)

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Next.js (App Router, deployed on Vercel) | 16.3.8 |
| UI | React | 19.3.0 |
| Language | TypeScript | 5.9.3 |
| LLM SDK | `@google/genai` (Google Gemini) | 2.27.0 |
| Wallet / chain | `viem` (EIP-712 signing, USDC reads, on-chain settlement) | 2.57.3 |
| Styling | Tailwind CSS + shadcn/ui | 4.3.3 / 4.21.0 |
| Runtime | Node.js | 24.14.0 |

## How the wallet + x402 part works (real on-chain settlement)

1. Maxx calls a paid API on this same app (e.g. `/api/weather`).
2. The API replies `402 Payment Required` with `{ price, asset, payTo, maxAmountRequired, resource }`.
3. Maxx's wallet signs an **EIP-3009 `TransferWithAuthorization`** (EIP-712 typed data over its USDC) and retries with it in the `X-PAYMENT` header.
4. The API's **facilitator wallet** recovers the signature, checks the price, validity window and on-chain nonce (replays are rejected), then **submits it to the USDC contract** — `transferWithAuthorization` on Base Sepolia.
5. USDC actually moves from the agent to the API owner on-chain, and the response carries the **basescan tx hash** (the UI's "Paid" badge links to it).

> This is no longer a signed-IOU demo: every paid call settles **real testnet USDC on-chain**. The agent's `USDC` balance in the panel drops as it spends (weather 0.01, fortune 0.05, research 0.1 per call). All funds are Base Sepolia testnet — nothing of value.

Both paid routes run through one reusable framework (`lib/x402.ts`): `paidApi({ price, handler })` handles the 402 demand, EIP-3009 verification, on-chain settlement, per-payer rate limits (10 paid calls/min) and a per-IP guard (60 req/min → `429` with `Retry-After`). The chat endpoint is rate-limited too (30 req/min per IP).

**Human in the loop**: paid tool calls pause the agent and pop an approval card in the chat — tool, arguments and price. Nothing is signed until you hit **Approve & pay**; **Deny** sends the refusal back to the model and it answers without the data. Free tools run automatically. After approval the UI shows the settlement tx (linked to basescan) and the wallet panel refreshes — you can watch the USDC balance tick down.

## Run it locally

```bash
npx agentmaxxin agentmaxxing   # or clone this repo + npm i
npm run dev
```

1. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and put it in `.env` as `GEMINI_API_KEY`.
2. Open [http://localhost:3000](http://localhost:3000) — the Setup panel walks you through the rest.
3. Try: *"What's the weather in Mumbai?"* · *"What's in your wallet?"* · *"Read my fortune"*

The wallet is pre-created via `WALLET_PRIVATE_KEY` in `.env` so local and deployed instances share the same address.

## Deploy to Vercel

1. Push this repo to GitHub and import it on [vercel.com](https://vercel.com).
2. Add environment variables in the Vercel project settings:
   - `GEMINI_API_KEY` — your Gemini key (required)
   - `GEMINI_MODEL` — e.g. `gemini-flash-lite-latest`
   - `WALLET_PRIVATE_KEY` — the **agent's** test wallet (Vercel's filesystem is read-only, so `.agent-wallet.json` can't be created there)
   - `FACILITATOR_PRIVATE_KEY` — the **API owner** wallet that submits settlements; it needs a little Base Sepolia ETH for gas
3. Deploy. The paid APIs live in the same deployment and `baseUrl` resolves to the deployment origin automatically.

## Project structure

```
agent/
  agent.ts            # the agent loop (Gemini + tools) and Maxx's system prompt
  tools.ts            # the tool belt — add yours here
  wallet.ts           # wallet identity + balances; signs EIP-3009 payments
lib/
  x402.ts             # the paid-API framework: sign -> 402 -> verify -> settle on-chain -> rate limit
app/
  api/agent/route.ts  # chat endpoint (rate limited) + setup status
  api/wallet/route.ts # wallet status / creation
  api/weather/route.ts# paid weather API — live open-meteo data, 0.01 USDC on-chain
  api/fortune/route.ts# my own paid fortune API, 0.05 USDC on-chain
  api/research/route.ts # paid deep research — searches + crawls the web, 0.1 USDC
  page.tsx            # the chat UI with setup panel + tool-call inspector
lib/
  web.ts              # search + the SSRF-guarded crawler (DNS checks, allowlist, caps)
```

Crawl scope: the crawler only fetches hosts on an allowlist (default: wikipedia.org, news.ycombinator.com, github.com, developer.mozilla.org — extend with `CRAWL_ALLOWED_HOSTS`), https-only, ports 80/443, no URL credentials, DNS resolved and rejected if it points at loopback/private/reserved addresses, manual redirect re-validation, 8s timeout and 512KB size cap per page.

## Future Scope (Week 2 & 3)

- **x402 to the next level**: Base mainnet / real USDC support, switching to a hosted facilitator (e.g. Coinbase CDP), and more paid tools with dynamic pricing.
- **ZK integration**: privacy-preserving proofs around agent spending — e.g. zkTLS attestations that a paid API call happened, without revealing the query; anonymous per-agent spend limits.
- **On-chain agent identity + reputation**: register the agent and its payment history on-chain so others can rate a paying agent before serving it.
- **Spending dashboard**: per-tool, per-day USDC spend ledger stored on-chain, so the human can audit exactly what the agent bought.
- **Model picker in the UI** (model switching is env-var based today) + streaming responses.
- **Multi-agent**: Maxx hiring a second agent (e.g. a crawler agent) and paying it via x402 — agent-to-agent commerce.

## Social Media

- 🐦 X (Twitter) product page: _[paste your @handle product page link here]_

## What I learned building this (Week 1)

- An **agent is a loop, not a chatbot**: model → tool calls → results → model, until the model answers in text. Seeing `MAX_STEPS` in `agent/agent.ts` made that concrete.
- **Tools are just functions with good descriptions** — the LLM reads the `description` and JSON schema and decides when to call them. The description is the interface.
- The **x402 idea**: an API can demand payment with HTTP 402, and the *agent itself* signs and pays — machines settling per-request, no accounts or API keys. I took it all the way: real EIP-3009 `TransferWithAuthorization` signatures settled on-chain by a facilitator wallet, with the tx hash shown in the UI.
- **EIP-712 domains are treacherous**: Base Sepolia's USDC signs its domain as `"USDC"` version `"2"`, while mainnet-style docs say `"USD Coin"`. I proved the right one by hashing candidate domains and comparing against the contract's own on-chain `DOMAIN_SEPARATOR()`.
- **Serverless constraints are real**: Vercel can't persist `.agent-wallet.json`, so wallets come from env. Deploying taught me more about the runtime than the code did.
- **Testnets are not interchangeable**: faucet USDC sent to Ethereum Sepolia showed as 0 in the wallet — same address, different chain. Fixed by reading USDC (`balanceOf`) on both Sepolias so funds display wherever they landed.
- **Rate limits matter once money is involved**: paid endpoints got per-payer sliding-window limits plus a per-IP guard; the chat endpoint (which fronts a paid LLM) got one too.
- **A research agent is search + crawl + reasoning**: free quick hits from fixed APIs, paid deep research that actually crawls pages — and the model, not the crawler, does the synthesizing. Chat memory got a rough token window (~6k tokens) so long conversations stay inside budget.
- Experimented with wiring **two paid endpoints** off the same wallet and free external APIs (CoinGecko, REST Countries, Open-Meteo) alongside them.

## Credits

Built on the [agentmaxxin](https://www.npmjs.com/package/agentmaxxin) starter kit (Agentmaxxing × Rise In). Customized for Week 1: agent persona, extra tools, second paid API, deployment hardening.
