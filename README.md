# Agentmaxxing 🤖💰

**Maxx** — an AI agent with its own crypto wallet, built with the [agentmaxxin](https://www.npmjs.com/package/agentmaxxin) starter kit for the **Agentmaxxing × Rise In Week 1** challenge.

Maxx is powered by Google Gemini, decides for itself which tools to call, and when an API costs money it **signs the payment from its own wallet** (x402 pattern) without asking anyone. You can watch every tool call and every signed payment in the chat UI.

## What Maxx can do

| Tool | What it does | Costs? |
| --- | --- | --- |
| `get_weather` | Current weather for any city (paid API at `/api/weather`) | 0.01 USDC, auto-paid |
| `get_fortune` | A secret degen fortune reading (paid API at `/api/fortune`, built by me) | 0.05 USDC, auto-paid |
| `get_my_wallet` | The agent's own address + ETH balance on Base Sepolia | free |
| `get_crypto_price` | Live crypto prices via the free CoinGecko API | free |
| `get_country_info` | Capital, population and region of any country (REST Countries) | free |
| `get_joke` | A random joke (Official Joke API) | free |
| `roll_dice` | Rolls a cryptographically secure dice 🎲 | free |

## How the wallet + x402 part works

1. Maxx calls a paid API on this same app (e.g. `/api/weather`).
2. The API replies `402 Payment Required` with a price.
3. Maxx's wallet (a fresh key stored server-side) signs a payment message.
4. Maxx retries with the signed payment in the `X-PAYMENT` header.
5. The API verifies the signature and serves the data.

> Payments are **signed test payments on Base Sepolia** — they are verified but never broadcast on-chain. No real funds move. The wallet is a throwaway test wallet.

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
   - `WALLET_PRIVATE_KEY` — a **test-only** wallet key (recommended: Vercel's filesystem is read-only, so `.agent-wallet.json` can't be created there)
3. Deploy. That's it — the paid APIs live in the same deployment and `baseUrl` resolves to the deployment origin automatically.

## Project structure

```
agent/
  agent.ts            # the agent loop (Gemini + tools) and Maxx's system prompt
  tools.ts            # the tool belt — add yours here
  wallet.ts           # wallet ops + the x402 payAndFetch helper
app/
  api/agent/route.ts  # chat endpoint + setup status
  api/wallet/route.ts # wallet status / creation
  api/weather/route.ts# mock paid weather API (0.01 USDC)
  api/fortune/route.ts# my own paid fortune API (0.05 USDC)
  page.tsx            # the chat UI with setup panel + tool-call inspector
```

## What I learned building this (Week 1)

- An **agent is a loop, not a chatbot**: model → tool calls → results → model, until the model answers in text. Seeing `MAX_STEPS` in `agent/agent.ts` made that concrete.
- **Tools are just functions with good descriptions** — the LLM reads the `description` and JSON schema and decides when to call them. The description is the interface.
- The **x402 idea**: an API can demand payment with HTTP 402, and the *agent itself* signs and pays — machines settling per-request, no accounts or API keys. Wild.
- **Serverless constraints are real**: Vercel can't persist `.agent-wallet.json`, so the wallet has to come from env (`WALLET_PRIVATE_KEY`). Deploying taught me more about the runtime than the code did.
- Experimented with wiring **two paid endpoints** off the same wallet and free external APIs (CoinGecko, REST Countries) alongside them.

## Credits

Built on the [agentmaxxin](https://www.npmjs.com/package/agentmaxxin) starter kit (Agentmaxxing × Rise In). Customized for Week 1: agent persona, extra tools, second paid API, deployment hardening.
