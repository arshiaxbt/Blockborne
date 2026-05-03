"use client";

import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Chain as ViemChain,
  type EIP1193Provider,
  type Hash,
} from "viem";
import { fastEVMFightersAbi } from "@/lib/abi/FastEVMFighters";
import type { BattleRound } from "@/lib/battle-engine";
import {
  isMegaethRpcConfigured,
  megaethTestnet,
  monadTestnet,
} from "@/lib/chains";
import { getBattleContractAddress, getExplorerTxUrl } from "@/lib/onchain";

type Status =
  | "idle"
  | "switching"
  | "waiting-signature"
  | "pending"
  | "success"
  | "error";

type EthereumWallet = {
  address: string;
  type: "ethereum";
  walletClientType: string;
  switchChain: (targetChainId: `0x${string}` | number) => Promise<void>;
  getEthereumProvider: () => Promise<unknown>;
};

function isEmbeddedEthereumWallet(wallet: unknown): wallet is EthereumWallet {
  const candidate = wallet as Partial<EthereumWallet>;

  return (
    candidate.type === "ethereum" &&
    typeof candidate.address === "string" &&
    typeof candidate.switchChain === "function" &&
    typeof candidate.getEthereumProvider === "function" &&
    (candidate.walletClientType === "privy" ||
      candidate.walletClientType === "privy-v2")
  );
}

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("rejected")) return "Signature rejected.";
  if (lower.includes("insufficient funds")) return "Insufficient testnet gas.";
  if (lower.includes("network") || lower.includes("chain")) {
    return "Could not switch to the required testnet.";
  }

  return message || "Could not record this action.";
}

function statusLabel(status: Status) {
  return status === "waiting-signature"
    ? "waiting for signature"
    : status === "pending"
      ? "pending tx"
      : status;
}

export function OnchainActionRecorder({ round }: { round: BattleRound }) {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [status, setStatus] = useState<Status>("idle");
  const [hash, setHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const embeddedWallet = useMemo(
    () => wallets.find(isEmbeddedEthereumWallet),
    [wallets],
  );
  const isMegaETH = round.attacker === "MegaETH";
  const chain = isMegaETH ? megaethTestnet : monadTestnet;
  const label = isMegaETH
    ? "Record MegaETH action on MegaETH"
    : "Record Monad action on Monad";

  const ensureWallet = async () => {
    if (!authenticated) {
      login();
      throw new Error("Login with Privy first.");
    }

    if (embeddedWallet) return embeddedWallet;

    const createdWallet = await createWallet();

    if (!isEmbeddedEthereumWallet(createdWallet)) {
      throw new Error("Create an embedded Ethereum wallet first.");
    }

    return createdWallet;
  };

  const record = async () => {
    setHash(null);
    setError(null);
    setStatus("switching");

    try {
      const contractAddress = getBattleContractAddress(chain.id);

      if (!contractAddress) {
        throw new Error(
          isMegaETH
            ? "Missing NEXT_PUBLIC_MEGAETH_BATTLE_CONTRACT."
            : "Missing NEXT_PUBLIC_MONAD_BATTLE_CONTRACT.",
        );
      }

      if (isMegaETH && !isMegaethRpcConfigured()) {
        throw new Error("Missing NEXT_PUBLIC_MEGAETH_RPC.");
      }

      const wallet = await ensureWallet();
      await wallet.switchChain(chain.id);
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: wallet.address as Address,
        chain: chain as ViemChain,
        transport: custom(provider as EIP1193Provider),
      });
      const publicClient = createPublicClient({
        chain: chain as ViemChain,
        transport: http(chain.rpcUrls.default.http[0]),
      });

      setStatus("waiting-signature");
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: fastEVMFightersAbi,
        functionName: "recordAction",
        args: [
          round.battleSessionId,
          round.attacker,
          round.actionName,
          round.actionType,
          BigInt(round.round),
          BigInt(round.damage),
          round.actionHash,
        ],
      });

      setHash(txHash);
      setStatus("pending");
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setStatus("success");
    } catch (recordError) {
      setStatus("error");
      setError(readableError(recordError));
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-black/35 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Action tx
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {round.attacker} records on {chain.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={record}
          disabled={status === "switching" || status === "waiting-signature" || status === "pending"}
          className={`rounded-lg border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isMegaETH
              ? "border-[#F5AF94]/35 bg-[#F5AF94]/10 text-[#ECE8E8] hover:bg-[#F5AF94]/18"
              : "border-[#836EF9]/35 bg-[#836EF9]/10 text-[#FBFAF9] hover:bg-[#836EF9]/18"
          }`}
        >
          {status === "idle" || status === "error" ? label : statusLabel(status)}
        </button>
      </div>
      {hash ? (
        <a
          href={getExplorerTxUrl(chain.id, hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all rounded border border-[#90D79F]/20 bg-[#90D79F]/10 p-3 font-mono text-xs text-[#ECE8E8]"
        >
          {hash}
        </a>
      ) : null}
      {error ? (
        <p className="mt-3 rounded border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
