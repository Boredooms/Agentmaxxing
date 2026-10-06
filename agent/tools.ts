/**
 * YOUR AGENT'S TOOLS
 *
 * A tool is just a function the agent is allowed to call.
 * Gemini reads the `description` to decide WHEN to use it,
 * and `parameters` to know WHAT to pass in.
 *
 * Add your own tool: copy one of the objects below, change it,
 * and save. It shows up in the "Tools" list on the page.
 */
import { randomInt } from "crypto";
import { getWalletAddress, getWalletBalances, payAndFetch } from "./wallet";
import { searchSources } from "../lib/web";
import { safeFetchJson } from "../lib/x402";

export type Tool = {
  name: string;
  description: string;
  /** JSON Schema describing the inputs. */
  parameters: object;
  /** Set for tools that cost money — their calls pause for user approval. */
  cost?: string;
  /** The code that runs when the agent calls this tool. */
  run: (args: any, ctx: { baseUrl: string }) => Promise<unknown>;
};

export const tools: Tool[] = [
  // ─── 1. A paid API: the agent's wallet signs a payment to unlock it ───
  {
    name: "get_weather",
    description: "Get the current weather for a city. Costs 0.01 USDC, paid automatically from the agent's wallet.",
    cost: "0.01 USDC",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. Mumbai" },
      },
      required: ["city"],
    },
    run: async ({ city }, { baseUrl }) => {
      return payAndFetch(`${baseUrl}/api/weather?city=${encodeURIComponent(city)}`);
    },
  },

  // ─── 2. A second paid API I built, same x402 pattern, higher stakes ───
  {
    name: "get_fortune",
    description: "Get the agent's secret degen fortune (a crypto fortune-cookie reading). Costs 0.05 USDC, paid automatically.",
    cost: "0.05 USDC",
    parameters: { type: "object", properties: {} },
    run: async (_args, { baseUrl }) => payAndFetch(`${baseUrl}/api/fortune`),
  },

  // ─── 3. Wallet tool: read the agent's own wallet ───
  {
    name: "get_my_wallet",
    description:
      "Get the agent's own wallet address and its balances: native ETH and USDC on Base Sepolia (its home testnet), plus any USDC that a faucet sent to Ethereum Sepolia instead.",
    parameters: { type: "object", properties: {} },
    run: async () => {
      const balances = await getWalletBalances();
      return {
        address: getWalletAddress(),
        eth: balances.eth,
        usdc: balances.usdc,
        usdcOnEthereumSepolia: balances.usdcEthereumSepolia,
        network: "Base Sepolia (testnet)",
      };
    },
  },

  // ─── 4. Live crypto prices from a real free API ───
  {
    name: "get_crypto_price",
    description: "Get the current price of a cryptocurrency in USD or another fiat currency, using the free CoinGecko API.",
    parameters: {
      type: "object",
      properties: {
        coin: { type: "string", description: "Coin id on CoinGecko, e.g. ethereum, bitcoin, solana" },
        currency: { type: "string", description: "Fiat currency, default usd" },
      },
      required: ["coin"],
    },
    run: async ({ coin, currency = "usd" }) => {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=${encodeURIComponent(currency)}`
      );
      if (!res.ok) throw new Error(`CoinGecko said ${res.status}. Is "${coin}" a valid coin id?`);
      const data = await res.json();
      if (!data[coin]) throw new Error(`No price found for "${coin}". Try ethereum, bitcoin or solana.`);
      return { coin, ...data[coin] };
    },
  },

  // ─── 5. Country facts, straight from the builder guide ───
  {
    name: "get_country_info",
    description: "Get facts about a country, including its capital and population.",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Country name, e.g. India",
        },
      },
      required: ["country"],
    },
    run: async ({ country }) => {
      const res = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,capital,population,region,flags`
      );
      if (!res.ok) throw new Error(`Could not find a country called "${country}".`);
      const [data] = await res.json();
      return {
        name: data.name?.common,
        capital: data.capital?.[0],
        population: data.population,
        region: data.region,
        flag: data.flags?.png,
      };
    },
  },

  // ─── 6. A plain tool: no wallet, no API ───
  {
    name: "get_joke",
    description: "Get a random programming-friendly joke. Use when the user wants a joke.",
    parameters: { type: "object", properties: {} },
    run: async () => {
      const res = await fetch("https://official-joke-api.appspot.com/random_joke");
      if (!res.ok) throw new Error(`Joke API said ${res.status}. Try again.`);
      return res.json();
    },
  },

  // ─── 8. Free quick search: Wikipedia + Hacker News ───
  {
    name: "web_search",
    description: "Search the web for quick hits: Wikipedia articles and Hacker News stories. Returns titles, links and sources. Free.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for" },
      },
      required: ["query"],
    },
    run: async ({ query }) => {
      const hits = await searchSources(safeFetchJson, String(query));
      if (hits.length === 0) throw new Error(`No results for "${query}".`);
      return { query, results: hits };
    },
  },

  // ─── 9. PAID deep research: the agent's browser ───
  {
    name: "research_web",
    description:
      "Deep web research: searches multiple sources, crawls the top pages, extracts their text and returns structured findings with sources. Use for questions that need real reading, not just quick hits. Costs 0.1 USDC, charged after the user approves.",
    cost: "0.1 USDC",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Research question or topic" },
      },
      required: ["query"],
    },
    run: async ({ query }, { baseUrl }) =>
      payAndFetch(`${baseUrl}/api/research?q=${encodeURIComponent(String(query))}`),
  },

  // ─── 10. Another plain tool: pure code, no network at all ───
  {
    name: "roll_dice",
    description: "Roll a dice with the given number of sides.",
    parameters: {
      type: "object",
      properties: {
        sides: { type: "number", description: "How many sides the dice has. Default 6." },
      },
    },
    run: async ({ sides = 6 }) => ({ rolled: randomInt(1, sides + 1), sides }),
  },
];
