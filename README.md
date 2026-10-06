# Agentmaxxing 🤖💰

**Maxx** — an AI agent with its own crypto wallet, built with the [agentmaxxin](https://www.npmjs.com/package/agentmaxxin) starter kit for the **Agentmaxxing × Rise In Week 1** challenge.

Maxx is powered by Google Gemini, decides for itself which tools to call, and when an API costs money it **signs the payment from its own wallet** (x402 pattern) without asking anyone. You can watch every tool call and every signed payment in the chat UI.

## What Maxx can do

| Tool | What it does | Costs? |
| --- | --- | --- |
| `get_weather` | Live weather for any city (geocoding + current conditions from open-meteo.com), paid via on-chain settlement at `/api/weather` | 0.01 USDC, auto-paid on-chain |
| `get_fortune` | A secret degen fortune reading (paid API at `/api/fortune`, built by me) | 0.05 USDC, auto-paid on-chain |
| `get_my_wallet` | The agent's address + ETH and USDC balances (reads Base Sepolia, and Ethereum Sepolia for stranded faucet funds) | free |
| `get_crypto_price` | Live crypto prices via the free CoinGecko API | free |
| `get_country_info` | Capital, population and region of any country (REST Countries) | free |
| `get_joke` | A random joke (Official Joke API) | free |
| `roll_dice` | Rolls a cryptographically secure dice 🎲 | free |

## How the wallet + x402 part works (real on-chain settlement)

1. Maxx calls a paid API on this same app (e.g. `/api/weather`).
2. The API replies `402 Payment Required` with `{ price, asset, payTo, maxAmountRequired, resource }`.
3. Maxx's wallet signs an **EIP-3009 `TransferWithAuthorization`** (EIP-712 typed data over its USDC) and retries with it in the `X-PAYMENT` header.
4. The API's **facilitator wallet** recovers the signature, checks the price, validity window and on-chain nonce (replays are rejected), then **submits it to the USDC contract** — `transferWithAuthorization` on Base Sepolia.
5. USDC actually moves from the agent to the API owner on-chain, and the response carries the **basescan tx hash** (the UI's "Paid" badge links to it).

> This is no longer a signed-IOU demo: every paid call settles **real testnet USDC on-chain**. The agent's `USDC` balance in the panel drops as it spends (weather 0.01, fortune 0.05 per call). All funds are Base Sepolia testnet — nothing of value.

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
  page.tsx            # the chat UI with setup panel + tool-call inspector
```

## What I learned building this (Week 1)

- An **agent is a loop, not a chatbot**: model → tool calls → results → model, until the model answers in text. Seeing `MAX_STEPS` in `agent/agent.ts` made that concrete.
- **Tools are just functions with good descriptions** — the LLM reads the `description` and JSON schema and decides when to call them. The description is the interface.
- The **x402 idea**: an API can demand payment with HTTP 402, and the *agent itself* signs and pays — machines settling per-request, no accounts or API keys. I took it all the way: real EIP-3009 `TransferWithAuthorization` signatures settled on-chain by a facilitator wallet, with the tx hash shown in the UI.
- **EIP-712 domains are treacherous**: Base Sepolia's USDC signs its domain as `"USDC"` version `"2"`, while mainnet-style docs say `"USD Coin"`. I proved the right one by hashing candidate domains and comparing against the contract's own on-chain `DOMAIN_SEPARATOR()`.
- **Serverless constraints are real**: Vercel can't persist `.agent-wallet.json`, so wallets come from env. Deploying taught me more about the runtime than the code did.
- **Testnets are not interchangeable**: faucet USDC sent to Ethereum Sepolia showed as 0 in the wallet — same address, different chain. Fixed by reading USDC (`balanceOf`) on both Sepolias so funds display wherever they landed.
- **Rate limits matter once money is involved**: paid endpoints got per-payer sliding-window limits plus a per-IP guard; the chat endpoint (which fronts a paid LLM) got one too.
- Experimented with wiring **two paid endpoints** off the same wallet and free external APIs (CoinGecko, REST Countries, Open-Meteo) alongside them.

## Credits

Built on the [agentmaxxin](https://www.npmjs.com/package/agentmaxxin) starter kit (Agentmaxxing × Rise In). Customized for Week 1: agent persona, extra tools, second paid API, deployment hardening.
