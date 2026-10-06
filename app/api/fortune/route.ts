/**
 * THE DEGEN FORTUNE API — second paid endpoint, built on the same x402
 * framework as the weather route. 0.05 USDC per reading, settled on-chain.
 */
import { randomInt } from "crypto";
import { paidApi } from "@/lib/x402";

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

export const GET = paidApi({
  price: "0.05",
  payerLimit: 6,
  handler: async () => {
    const pick = <T,>(arr: T[]) => arr[randomInt(0, arr.length)];
    return {
      fortune: `${pick(OPENINGS)} "${pick(FORTUNES)}"`,
      luck: randomInt(0, 101) + "/100",
    };
  },
});
