import { createWallet, getWalletAddress, getWalletBalances } from "@/agent/wallet";

// GET /api/wallet -> the agent's wallet address and balances (or null if none yet)
export async function GET() {
  const address = getWalletAddress();
  if (!address) return Response.json({ address: null });

  const balances = await getWalletBalances().catch(() => null);
  return Response.json({
    address,
    balance: balances?.eth ?? "unavailable",
    usdc: balances?.usdc ?? "unavailable",
    usdcEthereumSepolia: balances?.usdcEthereumSepolia ?? null,
  });
}

// POST /api/wallet -> create the agent's wallet
export async function POST() {
  return Response.json({ address: createWallet() });
}
