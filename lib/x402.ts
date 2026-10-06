/**
 * THE x402 PAYMENT LAYER — real on-chain USDC settlement on Base Sepolia.
 *
 * Unlike the starter kit's sign-and-pretend flow, a payment here is an
 * EIP-3009 TransferWithAuthorization: the agent signs typed data, the API's
 * facilitator wallet verifies the signature and SUBMITS it to the USDC
 * contract, actually moving USDC from the agent to the API owner on-chain.
 *
 * Client side (agent tools):
 *   signX402Payment(account, demand) -> base64 X-PAYMENT header
 *
 * Server side (paid API routes):
 *   paidApi({ price, handler }) wraps any GET handler:
 *     1. per-IP rate limit (cheap abuse guard, 60 req/min)
 *     2. no payment -> 402 with { price, asset, payTo, maxAmountRequired, resource }
 *     3. payment    -> recover signature, check fields + validity window +
 *                      on-chain nonce, settle via facilitator, then run the
 *                      handler; response carries the settlement tx hash
 *     4. per-payer rate limit (default 10 paid calls/min)
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  verifyTypedData,
  hexToSignature,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// ─── constants ────────────────────────────────────────────────────────────
export const USDC_ADDRESS: Address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const USDC_DECIMALS = 6;
export const BASESCAN_TX = (hash: string) => `https://sepolia.basescan.org/tx/${hash}`;

// Verified on-chain against the contract's own DOMAIN_SEPARATOR (probe-usdc-domain.ts).
// Mainnet's "USD Coin" domain does NOT match here — Base Sepolia signs as "USDC" v2.
const USDC_DOMAIN = {
  name: "USDC",
  version: "2",
  chainId: baseSepolia.id,
  verifyingContract: USDC_ADDRESS,
} as const;

const TRANSFER_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

const USDC_ABI = [
  {
    name: "transferWithAuthorization",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "authorizationState",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ─── client side: the agent signs a payment ───────────────────────────────
export type PaymentDemand = { payTo: string; maxAmountRequired: string; resource: string };

/** Sign an EIP-3009 payment for a 402 demand, encoded as an X-PAYMENT header. */
export async function signX402Payment(account: { address: Address; signTypedData: (args: any) => Promise<Hex> }, demand: PaymentDemand): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const message = {
    from: account.address,
    to: demand.payTo as Address,
    value: BigInt(demand.maxAmountRequired),
    validAfter: BigInt(now - 60),
    validBefore: BigInt(now + 300),
    nonce: hexNonce(),
  };
  const signature = await account.signTypedData({
    domain: USDC_DOMAIN,
    types: TRANSFER_TYPES,
    primaryType: "TransferWithAuthorization",
    message,
  });
  const payload = { ...message, signature, resource: demand.resource };
  return Buffer.from(JSON.stringify(payload, (_, v) => (typeof v === "bigint" ? v.toString() : v))).toString("base64");
}

function hexNonce(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return ("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")) as Hex;
}

// ─── server side: verify + settle + rate limit ────────────────────────────
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const usedNonces = new Set<string>();

function facilitator() {
  const key = process.env.FACILITATOR_PRIVATE_KEY as Hex | undefined;
  if (!key) throw new Error("FACILITATOR_PRIVATE_KEY missing — the API cannot settle payments.");
  return privateKeyToAccount(key);
}

export function facilitatorAddress(): Address {
  return facilitator().address;
}

export type Settlement = { from: Address; value: bigint; txHash: Hex };
type VerifyFail = { error: string };

/** Recover and check a signed payment, then settle it on-chain via the facilitator. */
export async function verifyAndSettle(
  header: string,
  demand: { payTo: Address; maxAmountRequired: bigint; resource: string }
): Promise<Settlement | VerifyFail> {
  let payload: {
    from: Address;
    to: Address;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: Hex;
    signature: Hex;
    resource?: string;
  };
  try {
    payload = JSON.parse(Buffer.from(header, "base64").toString());
  } catch {
    return { error: "Malformed X-PAYMENT header." };
  }

  const now = Math.floor(Date.now() / 1000);
  const value = BigInt(payload.value);
  const message = {
    from: payload.from,
    to: payload.to,
    value,
    validAfter: BigInt(payload.validAfter),
    validBefore: BigInt(payload.validBefore),
    nonce: payload.nonce,
  };

  const validSig = await verifyTypedData({
    address: payload.from,
    domain: USDC_DOMAIN,
    types: TRANSFER_TYPES,
    primaryType: "TransferWithAuthorization",
    message,
    signature: payload.signature,
  }).catch(() => false);

  if (!validSig) return { error: "Invalid payment signature." };
  if (payload.to !== demand.payTo) return { error: `Payment is not for this API's payTo address.` };
  if (payload.resource && payload.resource !== demand.resource) return { error: "Payment was signed for a different resource." };
  if (value < demand.maxAmountRequired) return { error: `Payment below price.` };
  if (now < Number(payload.validAfter) || now > Number(payload.validBefore)) return { error: "Payment window expired." };
  if (usedNonces.has(payload.nonce)) return { error: "Payment already used." };

  const usedOnChain = await publicClient
    .readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "authorizationState",
      args: [payload.from, payload.nonce],
    })
    .catch(() => false);
  if (usedOnChain) return { error: "Payment already used." };

  const { v, r, s } = hexToSignature(payload.signature);
  const wallet = createWalletClient({ account: facilitator(), chain: baseSepolia, transport: http() });
  let txHash: Hex;
  try {
    txHash = await wallet.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "transferWithAuthorization",
      args: [payload.from, payload.to, value, BigInt(payload.validAfter), BigInt(payload.validBefore), payload.nonce, Number(v), r, s],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") throw new Error("settlement reverted");
  } catch (err) {
    return { error: `Settlement failed: ${err instanceof Error ? err.message.slice(0, 140) : String(err).slice(0, 140)}` };
  }

  usedNonces.add(payload.nonce);
  return { from: payload.from, value, txHash };
}

// ─── rate limiting (in-memory sliding window) ─────────────────────────────
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterS: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterS: Math.max(1, Math.ceil((windowMs - (now - (hits[0] ?? now))) / 1000)) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterS: 0 };
}

function ipOf(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "direct";
}

// ─── outbound fetch guard ─────────────────────────────────────────────────
// Paid-API handlers may only call these hosts, over https. The handler passes
// a compile-time host literal + path + params; the URL is assembled HERE, so
// user input never shapes a URL string — only encoded query values.
const ALLOWED_HOSTS = ["api.open-meteo.com", "geocoding-api.open-meteo.com", "en.wikipedia.org", "hn.algolia.com"] as const;
export type AllowedHost = (typeof ALLOWED_HOSTS)[number];

export async function safeFetchJson(host: AllowedHost, path: string, params: Record<string, string>): Promise<unknown> {
  if (!ALLOWED_HOSTS.includes(host)) throw new Error(`Blocked host: ${host}`);
  const u = new URL(`https://${host}${path.startsWith("/") ? path : "/" + path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u);
  if (!res.ok) throw new Error(`${u.host} responded ${res.status}`);
  return res.json();
}

// ─── the paid API wrapper ─────────────────────────────────────────────────
export type PaidApiConfig = {
  /** Price in USDC, e.g. "0.01". */
  price: string;
  handler: (ctx: { url: URL; payer: Address }) => Promise<unknown>;
  /** Paid requests per payer per minute. Default 10. */
  payerLimit?: number;
};

export function paidApi(config: PaidApiConfig) {
  const maxAmountRequired = BigInt(Math.round(Number(config.price) * 10 ** USDC_DECIMALS));

  return async function GET(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const resource = url.pathname;
    const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
      Response.json(body, { status, headers });

    // 1. cheap per-IP guard before doing any crypto work
    const ipCheck = rateLimit(`ip:${ipOf(req)}:${resource}`, 60, 60_000);
    if (!ipCheck.ok) return json({ error: "Rate limit exceeded." }, 429, { "Retry-After": String(ipCheck.retryAfterS) });

    const demand = {
      price: config.price,
      asset: "USDC",
      payTo: facilitatorAddress(),
      maxAmountRequired: maxAmountRequired.toString(),
      resource,
    };

    // 2. no payment -> the 402 demand
    const header = req.headers.get("X-PAYMENT");
    if (!header) return json({ error: "Payment Required", ...demand }, 402);

    // 3. verify signature + settle on-chain
    const result = await verifyAndSettle(header, { payTo: demand.payTo, maxAmountRequired, resource }).catch((e) => ({
      error: String(e).slice(0, 140),
    }));
    if ("error" in result) return json({ error: result.error, ...demand }, 402);

    // 4. per-payer limit
    const payerCheck = rateLimit(`payer:${result.from}:${resource}`, config.payerLimit ?? 10, 60_000);
    if (!payerCheck.ok) return json({ error: "Payer rate limit exceeded." }, 429, { "Retry-After": String(payerCheck.retryAfterS) });

    // 5. serve
    try {
      const data = await config.handler({ url, payer: result.from });
      return json({
        ...(data as object),
        payment: {
          status: 200,
          amount: `${config.price} USDC`,
          to: demand.payTo,
          txHash: result.txHash,
          explorer: BASESCAN_TX(result.txHash),
        },
      });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  };
}
