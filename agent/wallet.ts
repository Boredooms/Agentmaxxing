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
const chain = createPublicClient({ chain: baseSepolia, transport: http() });
const ethereumSepolia = createPublicClient({ chain: sepolia, transport: http() });

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
  const wei = await chain.getBalance({ address: requireAccount().address });
  return `${formatEther(wei)} ETH`;
}

/** ETH + USDC balances. USDC is what the paid APIs price in. Faucets often
 *  fund Ethereum Sepolia instead of Base Sepolia, so we read USDC on both —
 *  the agent's home chain first, the other one reported separately. */
export async function getWalletBalances() {
  const address = requireAccount().address;
  const [eth, usdcBase, usdcEthereum] = await Promise.all([
    chain.getBalance({ address }).then((wei) => formatEther(wei)),
    chain
      .readContract({
        address: USDC_BASE_SEPOLIA,
        abi: ERC20_BALANCE_OF,
        functionName: "balanceOf",
        args: [address],
      })
      .then((raw) => `${formatUnits(raw, 6)} USDC`)
      .catch(() => null),
    ethereumSepolia
      .readContract({
        address: USDC_ETHEREUM_SEPOLIA,
        abi: ERC20_BALANCE_OF,
        functionName: "balanceOf",
        args: [address],
      })
      .then((raw) => `${formatUnits(raw, 6)} USDC`)
      .catch(() => null),
  ]);
  return { eth: `${eth} ETH`, usdc: usdcBase, usdcEthereumSepolia: usdcEthereum };
}

/** Fetch a URL. If it demands payment (402), sign an EIP-3009 authorization
 *  with the wallet and retry — the API then settles it on-chain for real. */
export async function payAndFetch(url: string) {
  const target = new URL(url);
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error(`Refusing to fetch non-HTTP(S) URL: ${target.protocol}`);
  }
  const first = await fetch(target);
  if (first.status !== 402) return { data: await first.json() };

  const demand = await first.json();
  const account = requireAccount();
  const header = await signX402Payment(account, {
    payTo: demand.payTo,
    maxAmountRequired: demand.maxAmountRequired,
    resource: demand.resource,
  });

  const paid = await fetch(target, { headers: { "X-PAYMENT": header } });
  const body = await paid.json().catch(() => ({}));
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
