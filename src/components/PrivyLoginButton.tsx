"use client";

import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useMemo, useState } from "react";
import { megaethTestnet, monadTestnet } from "@/lib/chains";

type EthereumWallet = {
  address: string;
  type: "ethereum";
  walletClientType: string;
  chainId?: string;
  switchChain: (targetChainId: `0x${string}` | number) => Promise<void>;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isEmbeddedEthereumWallet(wallet: unknown): wallet is EthereumWallet {
  const candidate = wallet as Partial<EthereumWallet>;

  return (
    candidate.type === "ethereum" &&
    typeof candidate.address === "string" &&
    typeof candidate.switchChain === "function" &&
    (candidate.walletClientType === "privy" ||
      candidate.walletClientType === "privy-v2")
  );
}

function getChainLabel(chainId?: string) {
  if (chainId === `eip155:${monadTestnet.id}` || chainId === "0x279f") {
    return monadTestnet.name;
  }

  if (chainId === `eip155:${megaethTestnet.id}` || chainId === "0x18c7") {
    return megaethTestnet.name;
  }

  return chainId ?? "Not connected";
}

export function PrivyLoginButton() {
  const { authenticated, login, logout, ready } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [switchingChain, setSwitchingChain] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const embeddedWallet = useMemo(
    () => wallets.find(isEmbeddedEthereumWallet),
    [wallets],
  );

  const handleCreateWallet = async () => {
    setError(null);
    setIsCreating(true);

    try {
      await createWallet();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Could not create embedded wallet.";

      if (!message.toLowerCase().includes("already")) {
        setError(message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchChain = async (chainId: number) => {
    if (!embeddedWallet) {
      return;
    }

    setError(null);
    setSwitchingChain(chainId);

    try {
      await embeddedWallet.switchChain(chainId);
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Could not switch embedded wallet network.",
      );
    } finally {
      setSwitchingChain(null);
    }
  };

  if (!ready) {
    return (
      <div className="rounded-lg border border-cyan-300/20 bg-black/40 px-4 py-3 text-sm text-slate-300">
        Loading wallet...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md rounded-lg border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(168,85,247,0.08),rgba(0,0,0,0.38))] p-4 shadow-[0_0_38px_rgba(34,211,238,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
          App wallet
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Play without MetaMask. Privy can create an embedded in-app wallet for
          optional testnet recording after a battle.
        </p>
        <button
          type="button"
          onClick={login}
          className="mt-4 w-full rounded-lg border border-cyan-300/45 bg-cyan-300/15 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-50 transition hover:bg-cyan-300/24"
        >
          Login / Create Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl rounded-lg border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.11),rgba(168,85,247,0.08),rgba(0,0,0,0.42))] p-4 shadow-[0_0_38px_rgba(34,211,238,0.1)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
            Embedded app wallet
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This wallet is created inside the app through Privy. MetaMask is not
            required for gameplay or recording.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-100 transition hover:bg-white/[0.08]"
        >
          Logout
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-slate-300">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Embedded wallet
          </p>
          {embeddedWallet ? (
            <p className="mt-1 font-mono font-bold text-white">
              <span title={embeddedWallet.address}>
                {shortenAddress(embeddedWallet.address)}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-slate-300">No embedded wallet yet</p>
          )}
        </div>
        <div className="rounded-md border border-white/10 bg-black/35 p-3 text-sm text-slate-300">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Current chain
          </p>
          <p className="mt-1 font-bold text-white">
            {getChainLabel(embeddedWallet?.chainId)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {!embeddedWallet ? (
          <button
            type="button"
            onClick={handleCreateWallet}
            disabled={isCreating}
            className="rounded-md border border-lime-300/35 bg-lime-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-lime-50 transition hover:bg-lime-300/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Creating..." : "Create embedded wallet"}
          </button>
        ) : null}
        {embeddedWallet ? (
          <>
            <button
              type="button"
              onClick={() => handleSwitchChain(monadTestnet.id)}
              disabled={Boolean(switchingChain)}
              className="rounded-md border border-fuchsia-300/35 bg-fuchsia-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-50 transition hover:bg-fuchsia-300/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {switchingChain === monadTestnet.id
                ? "Switching..."
                : "Switch to Monad Testnet"}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchChain(megaethTestnet.id)}
              disabled={Boolean(switchingChain)}
              className="rounded-md border border-orange-300/35 bg-orange-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-50 transition hover:bg-orange-300/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {switchingChain === megaethTestnet.id
                ? "Switching..."
                : "Switch to MegaETH Testnet"}
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
      {!process.env.NEXT_PUBLIC_PRIVY_APP_ID ? (
        <p className="mt-2 text-xs text-amber-200">
          Add NEXT_PUBLIC_PRIVY_APP_ID to enable Privy login in deployment.
        </p>
      ) : null}
    </div>
  );
}
