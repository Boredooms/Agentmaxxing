/**
 * THE AGENT'S WALLET
 *
 * The agent owns a wallet (a private key). It uses it to sign payments,
 * so it can pay for APIs on its own. This is the x402 flow, settled for real:
 *
 *   1. Agent calls an API      ->  API answers "402 Payment Required" + a price
 *   2. Agent signs EIP-3009    ->  typed-data authorization over its USDC
 *   3. Agent retries with the  ->  API's facilitator verifies the signature and
 *      X-PAYMENT header            submits it to the USDC contract on-chain
 *   4. USDC actually moves     ->  response carries the basescan tx hash
 *
 * You create the wallet with the "Create wallet" button on the page, or
 * provide one via WALLET_PRIVATE_KEY. It is saved in `.agent-wallet.json`.
 */
import fs from "fs";
import path from "path";
import {
  createPublicClient,
  formatEther,
  formatUnits,
  http,
  type Address,
  type Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia } from "viem/chains";
import { signX402Payment } from "../lib/x402";

const WALLET_FILE = path.join(process.cwd(), ".agent-wallet.json");

// Explicit public RPCs with a per-request timeout and a single retry. Without
// an explicit timeout a stalled node hangs the wallet panel (and the agent's
// get_my_wallet tool) forever — every balance read below is hard-capped.
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const ETHEREUM_SEPOLIA_RPC = process.env.ETHEREUM_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const RPC_TIMEOUT_MS = 8_000;
const BALANCE_DEADLINE_MS = 12_000;

const chain = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC, { timeout: RPC_TIMEOUT_MS, retryCount: 1 }),
});
const ethereumSepolia = createPublicClient({
  chain: sepolia,
  transport: http(ETHEREUM_SEPOLIA_RPC, { timeout: RPC_TIMEOUT_MS, retryCount: 1 }),
});

// Circle's testnet USDC contracts — paid APIs are priced in USDC.
const USDC_BASE_SEPOLIA: Address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_ETHEREUM_SEPOLIA: Address = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const ERC20_BALANCE_OF = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** The wallet from .env or .agent-wallet.json, or null if none was created yet. */
function loadAccount() {
  const key = process.env.WALLET_PRIVATE_KEY || (fs.existsSync(WALLET_FILE) && JSON.parse(fs.readFileSync(WALLET_FILE, "utf8")).privateKey);
  return key ? privateKeyToAccount(key as Hex) : null;
}

function requireAccount() {
  const account = loadAccount();
  if (!account) throw new Error("The agent has no wallet yet. Ask the user to click 'Create wallet' first.");
  return account;
}

/** Make a brand new wallet and save it. */
export function createWallet() {
  if (loadAccount()) return getWalletAddress();
  const privateKey = generatePrivateKey();
  fs.writeFileSync(WALLET_FILE, JSON.stringify({ privateKey }, null, 2));
  return privateKeyToAccount(privateKey).address;
}

export function getWalletAddress() {
  return loadAccount()?.address ?? null;
}

export async function getWalletBalance() {
  const wei = await withDeadline(chain.getBalance({ address: requireAccount().address }), null);
  return wei === null ? "unavailable (node busy)" : `${formatEther(wei)} ETH`;
}

/** Race a promise against a deadline; on timeout (or error) resolve to the
 *  fallback instead of hanging. Balance reads must NEVER block forever. */
function withDeadline<T>(p: Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), BALANCE_DEADLINE_MS);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

/** ETH + USDC balances. USDC is what the paid APIs price in. Faucets often
 *  fund Ethereum Sepolia instead of Base Sepolia, so we read USDC on both —
 *  the agent's home chain first, the other one reported separately.
 *  Any read that times out degrades to `null` (never hangs); `rpcError`
 *  says the node was unreachable when even the home-chain read failed. */
export async function getWalletBalances() {
  const address = requireAccount().address;
  const [eth, usdcBase, usdcEthereum] = await Promise.all([
    withDeadline(chain.getBalance({ address }).then((wei) => formatEther(wei)), null),
    withDeadline(
      chain.readContract({
        address: USDC_BASE_SEPOLIA,
        abi: ERC20_BALANCE_OF,
        functionName: "balanceOf",
        args: [address],
      }).then((raw) => `${formatUnits(raw, 6)} USDC`),
      null
    ),
    withDeadline(
      ethereumSepolia.readContract({
        address: USDC_ETHEREUM_SEPOLIA,
        abi: ERC20_BALANCE_OF,
        functionName: "balanceOf",
        args: [address],
      }).then((raw) => `${formatUnits(raw, 6)} USDC`),
      null
    ),
  ]);
  return {
    eth,
    usdc: usdcBase,
    usdcEthereumSepolia: usdcEthereum,
    rpcError: eth === null ? "Balance node did not answer in time — refresh to retry." : undefined,
  };
}

/** Fetch a URL. If it demands payment (402), sign an EIP-3009 authorization
 *  with the wallet and retry — the API then settles it on-chain for real. */
export async function payAndFetch(url: string) {
  const target = new URL(url);
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error(`Refusing to fetch non-HTTP(S) URL: ${target.protocol}`);
  }
  const first = await fetch(target, { signal: AbortSignal.timeout(10_000) });
  if (first.status !== 402) return { data: await first.json() };

  const demand = await first.json();
  const account = requireAccount();
  const header = await signX402Payment(account, {
    payTo: demand.payTo,
    maxAmountRequired: demand.maxAmountRequired,
    resource: demand.resource,
  });

  const paid = await fetch(target, { headers: { "X-PAYMENT": header }, signal: AbortSignal.timeout(30_000) });
  const body = await paid.json().catch(() => ({}));
  if (paid.status !== 200) {
    // the job failed and was never settled — surface the reason, charge nothing
    throw new Error(body?.error ? `The paid API said: ${body.error}` : `The paid API returned ${paid.status}`);
  }
  return {
    data: body,
    payment: {
      status: paid.status,
      amount: `${demand.price} ${demand.asset}`,
      to: demand.payTo,
      txHash: body?.payment?.txHash,
    },
  };
}
