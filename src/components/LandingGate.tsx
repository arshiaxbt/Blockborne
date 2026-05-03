"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Swords } from "lucide-react";
import type { ReactNode } from "react";

export function LandingGate({ children }: { children: ReactNode }) {
  const { authenticated, login, ready } = usePrivy();

  if (ready && authenticated) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050508] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.2),transparent_28%),linear-gradient(180deg,#050508,#090914_48%,#050508)]" />
      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-5 py-12 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
          <Swords className="text-cyan-100" size={30} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.34em] text-cyan-100">
          Onchain arena
        </p>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-7xl">
          Blockborne
        </h1>
        <p className="mt-4 text-lg font-semibold text-slate-200 sm:text-2xl">
          An educational onchain fighting game for network design.
        </p>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
          MegaETH and Monad fight through architecture-based abilities. Results
          depend on arena, loadout, and tradeoffs, not a universal ranking.
        </p>
        <button
          type="button"
          onClick={login}
          disabled={!ready}
          className="mt-9 rounded-xl border border-cyan-200/50 bg-cyan-300/15 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-cyan-50 shadow-[0_0_42px_rgba(34,211,238,0.16)] transition hover:bg-cyan-300/24 disabled:cursor-wait disabled:opacity-60"
        >
          {ready ? "Login / Create Wallet" : "Loading Privy..."}
        </button>
        <p className="mt-4 text-sm font-medium text-slate-400">
          No MetaMask required. Privy creates an embedded wallet for you.
        </p>
      </section>
    </main>
  );
}
