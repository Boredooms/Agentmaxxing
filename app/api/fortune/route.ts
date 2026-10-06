/**
 * A SECOND PAID API, built from the weather route as a reference.
 *
 * Same x402 dance: no payment -> 402 with the price. Valid signed payment -> fortune.
 * Proves the pattern generalizes: any route can become a paid endpoint.
 */
import { randomInt } from "crypto";
import { verifyPayment } from "@/agent/wallet";

const PRICE = "0.05";
const ASSET = "USDC";
const PAY_TO = "0x000000000000000000000000000000000000dEaD"; // the API owner's wallet (demo)

const OPENINGS = [
  "The chain whispers:",
  "An ancient degen once said:",
  "The candles have spoken:",
  "Your on-chain aura reveals:",
  "The mempool murmurs:",
];

const FORTUNES = [
  "buy high, sell never — hodling is a lifestyle, not a strategy",
  "the next gas spike carries your name on it. hydrate your wallet",
  "a bridge you trust today will test you tomorrow. verify, then verify again",
  "great fortune awaits behind a seed phrase you have not backed up yet. fix that",
  "you will receive an airdrop from a contract you do not remember approving",
  "patience is the only oracle worth trusting. also, touch grass",
  "your bags are heavy because they carry lessons. one of them is about to pay rent",
  "beware of DMs from strangers offering green candles",
  "the testnet giveth, and the testnet taketh away. sign boldly, risk nothing",
  "an old wallet you abandoned will remember you fondly. check it",
];

export async function GET(req: Request) {
  const payment = await verifyPayment(req.headers.get("X-PAYMENT"));
  if (!payment || payment.to !== PAY_TO || Number(payment.amount) < Number(PRICE)) {
    return Response.json({ error: "Payment Required", price: PRICE, asset: ASSET, payTo: PAY_TO }, { status: 402 });
  }

  const pick = <T,>(arr: T[]) => arr[randomInt(0, arr.length)];
  return Response.json({
    fortune: `${pick(OPENINGS)} "${pick(FORTUNES)}"`,
    luck: randomInt(0, 101) + "/100",
    paidBy: payment.from,
  });
}
