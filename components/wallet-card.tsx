"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Wallet } from "lucide-react";
import { shortAddress } from "@/lib/history";
import { cn } from "@/lib/utils";

type WalletInfo = {
  address: string | null;
  balance?: string;
  usdc?: string | null;
  usdcEthereumSepolia?: string | null;
  rpcError?: string | null;
  error?: string;
};

function formatEth(value?: string | null) {
  if (!value) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(4)} ETH` : value;
}

export function WalletCard({ allowCreate = false, refreshKey = 0 }: { allowCreate?: boolean; refreshKey?: number }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/wallet", { signal: AbortSignal.timeout(20_000) });
      setWallet(await res.json());
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function create() {
    setCreating(true);
    try {
      await fetch("/api/wallet", { method: "POST" });
      await load();
    } finally {
      setCreating(false);
    }
  }

  function copy() {
    if (!wallet?.address) return;
    navigator.clipboard?.writeText(wallet.address).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined
    );
  }

  return (
    <section className="surface p-4" aria-labelledby="wallet-heading">
      <div className="flex items-center justify-between gap-2">
        <h2 id="wallet-heading" className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
          <Wallet className="size-3.5 text-primary" /> Agent wallet
        </h2>
        <span className="border border-primary/30 bg-primary/5 px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase text-primary">
          Base Sepolia · testnet
        </span>
      </div>

      {!wallet && busy && (
        <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Reading wallet…
        </p>
      )}

      {failed && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">Could not reach the wallet API.</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 inline-flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[10px] uppercase hover:border-primary/50"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      )}

      {wallet && !wallet.address && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            No signing wallet is configured. Free tools work; paid tools cannot run until a testnet wallet exists.
          </p>
          {allowCreate && (
            <button
              type="button"
              onClick={create}
              disabled={creating}
              className="inline-flex w-fit items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[10px] tracking-wider uppercase hover:border-primary/50 disabled:opacity-50"
            >
              {creating ? <Loader2 className="size-3 animate-spin" /> : <Wallet className="size-3" />}
              Create local testnet wallet
            </button>
          )}
        </div>
      )}

      {wallet?.address && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 border border-border bg-background/70 px-2.5 py-2">
            <code className="truncate font-mono text-[11px] text-primary" title={wallet.address}>
              {shortAddress(wallet.address)}
            </code>
            <button type="button" onClick={copy} aria-label="Copy wallet address" className="text-muted-foreground hover:text-foreground">
              {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <dt className="text-[9px] tracking-wider uppercase text-muted-foreground">ETH (gas)</dt>
              <dd className={cn("mt-0.5", wallet.balance === "unavailable" && "text-muted-foreground")}>
                {formatEth(wallet.balance)}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] tracking-wider uppercase text-muted-foreground">USDC (spend)</dt>
              <dd className={cn("mt-0.5", wallet.usdc === "unavailable" && "text-muted-foreground")}>{wallet.usdc ?? "—"}</dd>
            </div>
          </dl>
          {wallet.rpcError && <p className="text-[10px] leading-relaxed text-muted-foreground">{wallet.rpcError}</p>}
          {wallet.usdcEthereumSepolia && wallet.usdcEthereumSepolia !== "0 USDC" && (
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {wallet.usdcEthereumSepolia} sits on Ethereum Sepolia — a different testnet; this agent spends on Base
              Sepolia.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-2 font-mono text-[10px] uppercase">
            <a
              href={`https://sepolia.basescan.org/address/${wallet.address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Explorer <ExternalLink className="size-2.5" />
            </a>
            <button
              type="button"
              onClick={load}
              disabled={busy}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("size-2.5", busy && "animate-spin")} /> Refresh
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
        Testnet only. Paid calls settle test USDC on-chain after approval and cannot be reversed.
      </p>
    </section>
  );
}
